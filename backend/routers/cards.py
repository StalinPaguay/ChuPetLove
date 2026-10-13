"""
routers/cards.py - Billetera de Tarjetas del Banco Pichincha.

Endpoints:
  - GET    /api/cards          → Listar tarjetas del cliente autenticado
  - POST   /api/cards          → Registrar nueva tarjeta con validación CI y Banco Pichincha
  - DELETE /api/cards/{id}     → Eliminar tarjeta guardada

Validaciones:
  - Cédula/RUC ecuatoriana (algoritmo módulo 10)
  - Número de tarjeta/cuenta de Banco Pichincha (10–19 dígitos numéricos)

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import UserCard, User, UserRole
from ..schemas import UserCardCreate, UserCardResponse
from ..security import get_current_user, require_roles

router = APIRouter(prefix="/api/cards", tags=["Billetera de Tarjetas (Banco Pichincha)"])


# ==========================================
# FUNCIONES DE VALIDACIÓN ECUADOR
# ==========================================

def validate_ecuador_ci(ci: str) -> bool:
    """
    Valida número de cédula ecuatoriana de 10 dígitos mediante el algoritmo de módulo 10.
    También acepta RUC de 13 dígitos (cédula + 001).
    """
    ci = ci.strip()
    if not ci.isdigit():
        return False

    # Permitir RUC de 13 dígitos si termina en 001
    if len(ci) == 13:
        if not ci.endswith("001"):
            return False
        ci = ci[:10]
    elif len(ci) != 10:
        return False

    provincia = int(ci[:2])
    if provincia < 1 or (provincia > 24 and provincia != 30):
        return False

    tercer_digito = int(ci[2])
    if tercer_digito >= 6:
        return False

    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    suma = 0
    for i in range(9):
        val = int(ci[i]) * coeficientes[i]
        if val >= 10:
            val -= 9
        suma += val

    digito_verificador = (10 - (suma % 10)) % 10
    return digito_verificador == int(ci[9])


def validate_banco_pichincha_card(card_num: str) -> bool:
    """
    Valida el número de tarjeta/cuenta del Banco Pichincha.
    Debe contener entre 10 y 19 dígitos numéricos (Visa/Mastercard Pichincha o Número de Cuenta).
    Se limpian espacios y guiones antes de validar.
    """
    clean_num = re.sub(r'[\s\-]', '', card_num)
    if not clean_num.isdigit() or len(clean_num) < 10 or len(clean_num) > 19:
        return False
    return True


# ==========================================
# ENDPOINTS DE TARJETAS (ESTRICTAMENTE PRIVADO PARA CLIENTES)
# ==========================================

@router.get(
    "",
    response_model=List[UserCardResponse],
    summary="Listar tarjetas registradas del cliente (Privado)"
)
def get_user_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.CLIENTE]))
):
    """
    Retorna las tarjetas guardadas en la billetera exclusivamente del cliente autenticado.
    Por normativas estrictas de privacidad (ISO/IEC 25010 y PCI-DSS),
    los roles de Vendedor y Administrador tienen PROHIBIDO el acceso a este endpoint.
    """
    cards = db.query(UserCard).filter(UserCard.user_id == current_user.id).all()
    return cards


@router.post(
    "",
    response_model=UserCardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nueva tarjeta Banco Pichincha"
)
def create_user_card(
    card_in: UserCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.CLIENTE]))
):
    """
    Registra una nueva tarjeta o cuenta en la billetera del cliente con validación estricta:
    - Validación de Cédula/RUC ecuatoriana (Algoritmo Módulo 10).
    - Validación de formato de tarjeta/cuenta Banco Pichincha (10-19 dígitos).
    """
    clean_ci = card_in.user_ci.strip()
    if not validate_ecuador_ci(clean_ci):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La Cédula o RUC ecuatoriano no es válido. "
                   "Verifique la provincia y el dígito verificador (algoritmo módulo 10)."
        )

    clean_card = re.sub(r'[\s\-]', '', card_in.card_number)
    if not validate_banco_pichincha_card(clean_card):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de tarjeta o cuenta de Banco Pichincha debe tener entre 10 y 19 dígitos numéricos."
        )

    new_card = UserCard(
        user_id=current_user.id,
        card_number=clean_card,
        card_holder_name=card_in.card_holder_name.strip().upper(),
        user_ci=clean_ci
    )

    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card


@router.delete(
    "/{card_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar tarjeta guardada"
)
def delete_user_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.CLIENTE]))
):
    """Permite al cliente eliminar una tarjeta de su billetera."""
    card = db.query(UserCard).filter(
        UserCard.id == card_id,
        UserCard.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta no encontrada en su billetera"
        )

    db.delete(card)
    db.commit()
    return None
