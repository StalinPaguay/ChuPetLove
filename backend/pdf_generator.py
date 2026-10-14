"""
pdf_generator.py - Generador de Facturas/Recibos Digitales en PDF.

Utiliza ReportLab para crear facturas profesionales con:
  - Encabezado de ChuPetLove (RUC, dirección, teléfono)
  - Datos del cliente y la orden
  - Tabla detallada de productos comprados
  - Desglose: Subtotal, IVA aplicado (%) y Total a pagar

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

try:
    from .models import Order
except (ImportError, ValueError):
    from models import Order


def generate_invoice_pdf(order: Order, iva_percentage: float) -> bytes:
    """
    Genera una factura formal en PDF para una orden con estado 'pagado'.
    Retorna el archivo PDF en formato de bytes listo para ser servido por FastAPI.

    Args:
        order: Objeto ORM de la orden (con relaciones user e items cargadas).
        iva_percentage: Porcentaje de IVA vigente al momento de la consulta.

    Returns:
        bytes: Contenido binario del PDF generado.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # ── Estilos personalizados ──
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=colors.HexColor('#2E7D32'),  # Verde ChuPetLove
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#555555'),
        alignment=0,
        spaceAfter=15
    )

    header_label_style = ParagraphStyle(
        'HeaderLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#333333')
    )

    header_val_style = ParagraphStyle(
        'HeaderVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#555555')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.white,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#222222')
    )

    table_cell_right_style = ParagraphStyle(
        'TableCellRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#222222'),
        alignment=2
    )

    story = []

    # ── Encabezado Principal de la Tienda ──
    story.append(Paragraph("🐾 PET SHOP CHUPETLOVE", title_style))
    story.append(Paragraph(
        "RUC: 1792345678001 | Matriz: Quito, Ecuador | Tel: (02) 234-5678 | www.chupetlove.ec",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2E7D32'), spaceAfter=15))

    # ── Información de la Orden y Cliente ──
    formatted_date = (
        order.created_at.strftime("%d/%m/%Y %H:%M")
        if order.created_at
        else datetime.now().strftime("%d/%m/%Y %H:%M")
    )
    payment_method_str = (
        "Efectivo" if order.payment_method.value == "efectivo"
        else "Tarjeta (Banco Pichincha)"
    )

    info_data = [
        [
            Paragraph(f"<b>N° FACTURA:</b> COMP-{order.id:06d}", header_label_style),
            Paragraph(f"<b>CLIENTE:</b> {order.user.username if order.user else 'Cliente'}", header_label_style)
        ],
        [
            Paragraph(f"<b>FECHA:</b> {formatted_date}", header_val_style),
            Paragraph(f"<b>EMAIL:</b> {order.user.email if order.user else 'N/A'}", header_val_style)
        ],
        [
            Paragraph(f"<b>MÉTODO DE PAGO:</b> {payment_method_str}", header_val_style),
            Paragraph(f"<b>ESTADO:</b> {order.payment_status.value.upper()}", header_val_style)
        ]
    ]

    info_table = Table(info_data, colWidths=[3.5 * inch, 3.5 * inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 15))

    # ── Tabla de Detalle de Productos ──
    items_data = [
        [
            Paragraph("N°", table_header_style),
            Paragraph("PRODUCTO", table_header_style),
            Paragraph("CANT.", table_header_style),
            Paragraph("PRECIO UNIT. ($)", table_header_style),
            Paragraph("TOTAL ($)", table_header_style)
        ]
    ]

    for index, item in enumerate(order.items, start=1):
        product_name = item.product.name if item.product else f"Producto #{item.product_id}"
        line_total = item.quantity * float(item.unit_price)

        items_data.append([
            Paragraph(str(index), table_cell_style),
            Paragraph(product_name, table_cell_style),
            Paragraph(str(item.quantity), table_cell_right_style),
            Paragraph(f"${float(item.unit_price):.2f}", table_cell_right_style),
            Paragraph(f"${line_total:.2f}", table_cell_right_style)
        ])

    items_table = Table(items_data, colWidths=[0.5 * inch, 3.5 * inch, 0.8 * inch, 1.1 * inch, 1.1 * inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))

    # ── Cuadro de Resumen Financiero ──
    total_label_style = ParagraphStyle(
        'TotLabel',
        parent=table_cell_right_style,
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor('#2E7D32')
    )
    total_val_style = ParagraphStyle(
        'TotVal',
        parent=table_cell_right_style,
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor('#2E7D32')
    )

    summary_data = [
        [
            Paragraph("<b>SUBTOTAL:</b>", table_cell_right_style),
            Paragraph(f"${float(order.subtotal):.2f}", table_cell_right_style)
        ],
        [
            Paragraph(f"<b>IVA ({iva_percentage:.1f}% Ecuador):</b>", table_cell_right_style),
            Paragraph(f"${float(order.iva_applied):.2f}", table_cell_right_style)
        ],
        [
            Paragraph("<b>TOTAL A PAGAR:</b>", total_label_style),
            Paragraph(f"<b>${float(order.total):.2f}</b>", total_val_style)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[5.0 * inch, 2.0 * inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#2E7D32')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(summary_table)

    # ── Pie de Página ──
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CCCCCC'), spaceAfter=10))

    footer_style = ParagraphStyle(
        'InvoiceFooter',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        textColor=colors.HexColor('#777777'),
        alignment=1
    )
    story.append(Paragraph(
        "¡Gracias por su compra en ChuPetLove! Cuidamos a tus mascotas con todo el amor. 🐶🐱🐹🐰",
        footer_style
    ))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "Este documento es un comprobante digital de su transacción. Conserve este recibo para cualquier reclamo.",
        ParagraphStyle('FooterNote', parent=footer_style, fontSize=8)
    ))

    # Construir el PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
