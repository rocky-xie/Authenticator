const MAX_URI_LENGTH = 8192;
const MAX_SECRET_LENGTH = 2048;
const MAX_LABEL_LENGTH = 512;

export interface ParsedOTPAuthURI {
  account: string;
  algorithm?: string;
  counter: number;
  digits?: number;
  issuer?: string;
  period?: number;
  secret: string;
  type: "totp" | "hotp" | "hex" | "hhex";
}

/** Parse and validate an otpauth URI without accepting arbitrary URL schemes. */
export function parseOTPAuthURI(value: string): ParsedOTPAuthURI | null {
  if (!value || value.length > MAX_URI_LENGTH) return null;

  let uri: URL;
  try {
    uri = new URL(value);
  } catch {
    return null;
  }

  if (uri.protocol !== "otpauth:" || !["totp", "hotp"].includes(uri.host)) {
    return null;
  }

  let label: string;
  try {
    label = decodeURIComponent(uri.pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
  if (!label || label.length > MAX_LABEL_LENGTH) return null;

  const separator = label.indexOf(":");
  const labelIssuer = separator >= 0 ? label.slice(0, separator).trim() : "";
  const account = (separator >= 0 ? label.slice(separator + 1) : label).trim();
  if (!account || account.length > MAX_LABEL_LENGTH) return null;

  const secret = (uri.searchParams.get("secret") || "")
    .replace(/\s/g, "")
    .toUpperCase();
  if (!secret || secret.length > MAX_SECRET_LENGTH) return null;

  const isBase32 = /^[A-Z2-7]+=*$/.test(secret);
  const isHex = /^[0-9A-F]+$/.test(secret);
  if (!isBase32 && !isHex) return null;

  const issuer = (uri.searchParams.get("issuer") || labelIssuer).trim();
  if (issuer.length > MAX_LABEL_LENGTH) return null;

  const rawDigits = uri.searchParams.get("digits");
  const parsedDigits = rawDigits === null ? undefined : Number(rawDigits);
  const digits =
    parsedDigits === undefined ||
    !Number.isInteger(parsedDigits) ||
    parsedDigits < 6 ||
    parsedDigits > 10
      ? undefined
      : parsedDigits;

  const rawPeriod = uri.searchParams.get("period");
  const parsedPeriod = rawPeriod === null ? undefined : Number(rawPeriod);
  const period =
    parsedPeriod === undefined ||
    !Number.isInteger(parsedPeriod) ||
    parsedPeriod <= 0 ||
    parsedPeriod > 60 ||
    60 % parsedPeriod !== 0
      ? undefined
      : parsedPeriod;

  const rawCounter = uri.searchParams.get("counter");
  const parsedCounter = rawCounter === null ? 0 : Number(rawCounter);
  const counter =
    Number.isSafeInteger(parsedCounter) && parsedCounter >= 0
      ? parsedCounter
      : 0;

  const requestedAlgorithm = (uri.searchParams.get("algorithm") || "")
    .replace(/[-_]/g, "")
    .toUpperCase();
  const supportedAlgorithms = new Set([
    "SHA1",
    "SHA256",
    "SHA512",
    "GOST34112012256",
    "GOST34112012512",
  ]);
  const algorithm = supportedAlgorithms.has(requestedAlgorithm)
    ? requestedAlgorithm.startsWith("GOST")
      ? requestedAlgorithm.replace("GOST34112012", "GOST3411_2012_")
      : requestedAlgorithm
    : undefined;

  let type: ParsedOTPAuthURI["type"] = uri.host as "totp" | "hotp";
  if (!isBase32 && isHex) type = type === "totp" ? "hex" : "hhex";

  return {
    account,
    algorithm,
    counter,
    digits,
    issuer: issuer || undefined,
    period,
    secret,
    type,
  };
}
