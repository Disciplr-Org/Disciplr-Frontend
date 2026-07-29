/**
 * Formats a raw USDC amount string for display.
 * - Adds thousands grouping (commas) on the integer part
 * - Caps decimal places at 7
 * - Preserves a trailing dot so the user can continue typing decimals
 */
export function formatUsdcInput(raw: string): string {
  if (!raw) return "";

  const dotIndex = raw.indexOf(".");
  const integerPart = dotIndex === -1 ? raw : raw.slice(0, dotIndex);
  let decimalPart = dotIndex === -1 ? "" : raw.slice(dotIndex + 1);

  // Cap decimals at 7
  if (decimalPart.length > 7) {
    decimalPart = decimalPart.slice(0, 7);
  }

  // Add thousands grouping
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // If raw ends with ".", preserve the decimal point (user is typing decimals)
  if (raw.endsWith(".")) {
    return formattedInteger + ".";
  }

  if (decimalPart) {
    return formattedInteger + "." + decimalPart;
  }

  return formattedInteger;
}

/**
 * Parses a display USDC amount string (possibly with commas, stray characters)
 * into a clean raw number string.
 * - Strips all non-digit / non-dot characters
 * - Keeps only the first dot (subsequent dots are removed)
 * - Caps decimals at 7
 * - Normalises leading zeros ("00" → "0", "01" → "1", but keeps "0.")
 */
export function parseUsdcInput(text: string): string {
  if (!text) return "";

  // Remove everything except digits and dots
  let cleaned = text.replace(/[^0-9.]/g, "");

  // Keep only the first dot
  const parts = cleaned.split(".");
  cleaned = parts.shift()! + (parts.length ? "." + parts.join("") : "");

  // Cap decimals at 7
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1 && cleaned.length - dotIndex - 1 > 7) {
    cleaned = cleaned.slice(0, dotIndex + 8);
  }

  // If the integer part is empty, prepend "0" (e.g. ".5" → "0.5")
  if (cleaned.startsWith(".")) {
    cleaned = "0" + cleaned;
  }

  // Normalize leading zeros on the integer part
  // e.g. "00" → "0", "01" → "1", but "0." → "0."
  if (cleaned.startsWith("0") && cleaned.length > 1 && cleaned[1] !== ".") {
    cleaned = cleaned.replace(/^0+/, "");
    if (cleaned === "" || cleaned.startsWith(".")) {
      cleaned = "0" + cleaned;
    }
  }

  return cleaned;
}
