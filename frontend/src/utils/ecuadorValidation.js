/**
 * ecuadorValidation.js - Validaciones para el mercado ecuatoriano en el frontend.
 * 
 * 1. Algoritmo Módulo 10 para Cédula de Identidad y RUC persona natural.
 * 2. Validación de formato de Tarjeta de Banco Pichincha (10 a 19 dígitos).
 */

export function validateEcuadorianId(ci) {
  if (!ci || typeof ci !== 'string') return { isValid: false, message: 'La identificación es requerida' };
  
  const cleanCi = ci.trim();
  
  // Validar longitud: Cédula (10 dígitos) o RUC persona natural (13 dígitos)
  if (!/^\d{10}(\d{3})?$/.test(cleanCi)) {
    return { isValid: false, message: 'La identificación debe tener 10 dígitos (Cédula) o 13 dígitos (RUC)' };
  }

  const provinceCode = parseInt(cleanCi.substring(0, 2), 10);
  if ((provinceCode < 1 || provinceCode > 24) && provinceCode !== 30) {
    return { isValid: false, message: 'Código de provincia no válido en Ecuador (01-24)' };
  }

  const thirdDigit = parseInt(cleanCi[2], 10);
  if (thirdDigit >= 6) {
    return { isValid: false, message: 'El tercer dígito de la cédula no es válido (< 6)' };
  }

  // Algoritmo Módulo 10 sobre los primeros 9 dígitos
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let val = parseInt(cleanCi[i], 10) * coefficients[i];
    if (val >= 10) val -= 9;
    sum += val;
  }

  const verifierDigit = parseInt(cleanCi[9], 10);
  const calculatedVerifier = (10 - (sum % 10)) % 10;

  if (verifierDigit !== calculatedVerifier) {
    return { isValid: false, message: 'Dígito verificador de Cédula Ecuatoriana incorrecto' };
  }

  // Si es RUC de 13 dígitos, los últimos 3 deben ser 001 o superior
  if (cleanCi.length === 13) {
    const establishment = cleanCi.substring(10, 13);
    if (establishment === '000') {
      return { isValid: false, message: 'El establecimiento del RUC no puede ser 000' };
    }
  }

  return { isValid: true, message: 'Identificación válida' };
}

export function validatePichinchaCard(cardNumber) {
  if (!cardNumber) return { isValid: false, message: 'El número de tarjeta es obligatorio' };
  const cleanNumber = cardNumber.replace(/[\s-]/g, '');
  if (!/^\d{10,19}$/.test(cleanNumber)) {
    return { isValid: false, message: 'El número de tarjeta de Banco Pichincha debe tener entre 10 y 19 dígitos numéricos' };
  }
  return { isValid: true, message: 'Número de tarjeta válido', formatted: cleanNumber };
}
