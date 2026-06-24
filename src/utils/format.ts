export interface FormatUsdcOptions {
  /** Currency suffix to append when includeCurrency is true. Defaults to USDC. */
  currency?: string;
  /** Include the currency suffix in the returned label. Defaults to true. */
  includeCurrency?: boolean;
  /** Maximum displayed decimals, capped to Stellar USDC's 7-decimal precision. */
  maxFractionDigits?: number;
  /** Minimum displayed decimals, padded with trailing zeroes. Defaults to 0. */
  minFractionDigits?: number;
}

export interface FormatAddressOptions {
  /** Leading characters to keep before the separator. Defaults to 6. */
  prefixLength?: number;
  /** Trailing characters to keep after the separator. Defaults to 4. */
  suffixLength?: number;
  /** Separator inserted between visible address segments. Defaults to "...". */
  separator?: string;
}

const USDC_DECIMALS = 7;

function assertFractionDigits(name: string, value: number) {
  if (!Number.isInteger(value) || value < 0 || value > USDC_DECIMALS) {
    throw new RangeError(`${name} must be an integer between 0 and ${USDC_DECIMALS}.`);
  }
}

function incrementDecimalString(value: string) {
  const digits = value.split("");
  let carry = 1;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const next = Number(digits[index]) + carry;
    if (next === 10) {
      digits[index] = "0";
      carry = 1;
    } else {
      digits[index] = String(next);
      carry = 0;
      break;
    }
  }

  if (carry === 1) {
    digits.unshift("1");
  }

  return digits.join("");
}

function normalizeAmount(amount: number | string) {
  const raw =
    typeof amount === "number"
      ? amount.toFixed(USDC_DECIMALS)
      : amount.trim().replace(/,/g, "").replace(/\s*USDC$/i, "");

  if (raw === "") {
    throw new RangeError("amount is required.");
  }

  if (raw.startsWith("-")) {
    throw new RangeError("USDC amounts cannot be negative.");
  }

  if (!/^\d+(?:\.\d+)?$/.test(raw)) {
    throw new RangeError("amount must be a non-negative decimal value.");
  }

  const [integerPart, fractionPart = ""] = raw.split(".");
  if (fractionPart.length > USDC_DECIMALS) {
    throw new RangeError(`USDC amounts support at most ${USDC_DECIMALS} decimal places.`);
  }

  return {
    integerPart: integerPart.replace(/^0+(?=\d)/, "") || "0",
    fractionPart,
  };
}

function roundAmountParts(integerPart: string, fractionPart: string, maxFractionDigits: number) {
  if (fractionPart.length <= maxFractionDigits) {
    return { integerPart, fractionPart };
  }

  const keptFraction = fractionPart.slice(0, maxFractionDigits);
  const nextDigit = Number(fractionPart[maxFractionDigits]);
  if (nextDigit < 5) {
    return { integerPart, fractionPart: keptFraction };
  }

  if (maxFractionDigits === 0) {
    return {
      integerPart: incrementDecimalString(integerPart),
      fractionPart: "",
    };
  }

  const expectedLength = integerPart.length + maxFractionDigits;
  const incremented = incrementDecimalString(`${integerPart}${keptFraction}`).padStart(
    expectedLength,
    "0",
  );

  return {
    integerPart: incremented.slice(0, -maxFractionDigits) || "0",
    fractionPart: incremented.slice(-maxFractionDigits),
  };
}

function groupThousands(integerPart: string) {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatUsdc(amount: number | string, options: FormatUsdcOptions = {}) {
  const {
    currency = "USDC",
    includeCurrency = true,
    maxFractionDigits = USDC_DECIMALS,
    minFractionDigits = 0,
  } = options;

  assertFractionDigits("maxFractionDigits", maxFractionDigits);
  assertFractionDigits("minFractionDigits", minFractionDigits);

  if (minFractionDigits > maxFractionDigits) {
    throw new RangeError("minFractionDigits cannot exceed maxFractionDigits.");
  }

  const normalized = normalizeAmount(amount);
  const rounded = roundAmountParts(
    normalized.integerPart,
    normalized.fractionPart,
    maxFractionDigits,
  );
  const trimmedFraction = rounded.fractionPart.replace(/0+$/, "");
  const fraction = trimmedFraction.padEnd(
    Math.max(minFractionDigits, trimmedFraction.length),
    "0",
  );
  const formattedAmount = fraction
    ? `${groupThousands(rounded.integerPart)}.${fraction}`
    : groupThousands(rounded.integerPart);

  return includeCurrency ? `${formattedAmount} ${currency}` : formattedAmount;
}

export function formatAddress(value: string, options: FormatAddressOptions = {}) {
  const {
    prefixLength = 6,
    suffixLength = 4,
    separator = "...",
  } = options;
  const address = value.trim();

  if (!address) {
    return "";
  }

  if (address.length <= prefixLength + suffixLength + separator.length) {
    return address;
  }

  return `${address.slice(0, prefixLength)}${separator}${address.slice(-suffixLength)}`;
}
