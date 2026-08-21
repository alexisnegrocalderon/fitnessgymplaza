/** Deja solo dígitos y K/k (mayúscula), sin puntos ni guión. */
function cleanRut(raw: string): string {
  return raw.replace(/[^0-9kK]/g, "").toUpperCase();
}

/** Dígito verificador módulo 11 chileno (K para resto 10, 0 para resto 11). */
function checkDigit(body: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

/** "123456785" o "12.345.678-5" -> true si el dígito verificador calza. */
export function isValidRut(raw: string): boolean {
  const clean = cleanRut(raw);
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return checkDigit(body) === dv;
}

/** Formatea en vivo mientras se escribe: "123456785" -> "12.345.678-5". */
export function formatRut(raw: string): string {
  const clean = cleanRut(raw).slice(0, 9);
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}
