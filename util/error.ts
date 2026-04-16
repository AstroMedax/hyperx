// ─────────────────────────────────────────
// Symbol Tag
// ─────────────────────────────────────────
const TAG = Symbol("TioError");

// ─────────────────────────────────────────
// Type
// ─────────────────────────────────────────
export interface TioError {
  readonly _id: symbol;
  readonly message: string;
  readonly [TAG]: true;
}

// ─────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────
function isTioError(val: unknown): val is TioError {
  return (
    typeof val === "object" &&
    val !== null &&
    (val as TioError)[TAG] === true
  );
}

// ─────────────────────────────────────────
// Core
// ─────────────────────────────────────────
function newError(message: string): TioError {
  return {
    _id: Symbol(),
    message,
    [TAG]: true as const,
  };
}

function isError(val: unknown, target: TioError): boolean {
  if (!isTioError(val)) return false;
  return val._id === target._id;
}

// ─────────────────────────────────────────
// Wrap (preserve identity)
// ─────────────────────────────────────────
function wrapError(
  cause: TioError,
  message: string
): TioError & { _cause: TioError } {
  return {
    _id: cause._id,
    message: `${message}: ${cause.message}`,
    [TAG]: true as const,
    _cause: cause,
  };
}

// ─────────────────────────────────────────
// Unwrap
// ─────────────────────────────────────────
function unwrapError(err: TioError): TioError | null {
  const inner = (err as TioError & { _cause?: TioError })._cause;
  return inner ?? null;
}

// ─────────────────────────────────────────
// Boundary Adapter (PENTING)
// ─────────────────────────────────────────
function fromUnknown(err: unknown): TioError {
  if (isTioError(err)) return err;

  // native Error → convert
  if (err instanceof Error) {
    return newError(err.message);
  }

  // fallback
  return newError(String(err));
}

// ─────────────────────────────────────────
// Type Guard
// ─────────────────────────────────────────
function checkIsError(val: unknown): val is TioError {
  return isTioError(val);
}

// ─────────────────────────────────────────
// Stringify
// ─────────────────────────────────────────
function toString(err: TioError): string {
  return `[TioError] ${err.message}`;
}

// ─────────────────────────────────────────
// Export
// ─────────────────────────────────────────
export const error = {
  new: newError,
  is: isError,
  wrap: wrapError,
  unwrap: unwrapError,
  check: checkIsError,
  string: toString,
  from: fromUnknown, // ⭐ penting
} as const;