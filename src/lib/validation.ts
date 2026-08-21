export const NAME_REGEX = /^[\u0590-\u05FFa-zA-Z\s\-']+$/;
export const PHONE_REGEX = /^(\+972|0)([23489]|5[0-9]|7[0-9])-?\d{7}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ID_NUMBER_REGEX = /^\d{9}$/;
export const COMPANY_NUMBER_REGEX = /^\d{8,9}$/;
export const DIGITS_ONLY_REGEX = /^\d+$/;
export const PRICE_REGEX = /^\d+(\.\d{1,2})?$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateName(value: string): ValidationResult {
  if (!value.trim()) return { isValid: false, error: 'שדה חובה' };
  if (!NAME_REGEX.test(value.trim())) {
    return { isValid: false, error: 'שם יכול להכיל רק אותיות עברית/אנגלית' };
  }
  if (value.trim().length < 2) {
    return { isValid: false, error: 'שם חייב להכיל לפחות 2 תווים' };
  }
  return { isValid: true };
}

export function validatePhone(value: string): ValidationResult {
  if (!value.trim()) return { isValid: false, error: 'שדה חובה' };
  const cleaned = value.replace(/[\s-]/g, '');
  if (!PHONE_REGEX.test(cleaned)) {
    return { isValid: false, error: 'מספר טלפון לא תקין (לדוגמה: 050-1234567)' };
  }
  return { isValid: true };
}

export function validateEmail(value: string, required = false): ValidationResult {
  if (!value.trim()) {
    return required ? { isValid: false, error: 'שדה חובה' } : { isValid: true };
  }
  if (!EMAIL_REGEX.test(value.trim())) {
    return { isValid: false, error: 'כתובת אימייל לא תקינה' };
  }
  return { isValid: true };
}

export function validateIdNumber(value: string, required = false): ValidationResult {
  if (!value.trim()) {
    return required ? { isValid: false, error: 'שדה חובה' } : { isValid: true };
  }
  if (!ID_NUMBER_REGEX.test(value.trim())) {
    return { isValid: false, error: 'מספר ת.ז. חייב להכיל 9 ספרות' };
  }
  return { isValid: true };
}

export function validateCompanyNumber(value: string, required = false): ValidationResult {
  if (!value.trim()) {
    return required ? { isValid: false, error: 'שדה חובה' } : { isValid: true };
  }
  if (!COMPANY_NUMBER_REGEX.test(value.trim())) {
    return { isValid: false, error: 'מספר חברה חייב להכיל 8-9 ספרות' };
  }
  return { isValid: true };
}

export function sanitizePhone(value: string): string {
  return value.replace(/[^0-9-+]/g, '');
}

export function sanitizeName(value: string): string {
  return value.replace(/[^\u0590-\u05FFa-zA-Z\s\-']/g, '');
}

export function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Allow digits and one decimal point (max 2 fractional digits). */
export function sanitizePrice(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  const intPart = cleaned.slice(0, dot);
  const fracPart = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  return `${intPart}.${fracPart}`;
}

export function validatePassword(value: string, minLength = 6): ValidationResult {
  if (!value) return { isValid: false, error: 'שדה חובה' };
  if (value.length < minLength) {
    return { isValid: false, error: `סיסמה חייבת להכיל לפחות ${minLength} תווים` };
  }
  return { isValid: true };
}

export function validatePasswordMatch(password: string, confirm: string): ValidationResult {
  if (password !== confirm) {
    return { isValid: false, error: 'הסיסמאות אינן תואמות' };
  }
  return { isValid: true };
}

export function validateRequired(value: string, label = 'שדה'): ValidationResult {
  if (!value.trim()) return { isValid: false, error: `${label} הוא שדה חובה` };
  return { isValid: true };
}

export function validatePositiveNumber(value: string | number, required = false): ValidationResult {
  const str = String(value ?? '').trim();
  if (!str) {
    return required ? { isValid: false, error: 'שדה חובה' } : { isValid: true };
  }
  const num = Number(str);
  if (Number.isNaN(num) || num < 0) {
    return { isValid: false, error: 'יש להזין מספר חיובי' };
  }
  return { isValid: true };
}

export function validatePercent(value: string | number): ValidationResult {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0 || num > 100) {
    return { isValid: false, error: 'אחוז בין 0 ל-100' };
  }
  return { isValid: true };
}
