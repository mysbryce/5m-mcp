import { AppError, ErrorCodeType } from "../errors/codes";

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: AppError };
export type Envelope<T> = Ok<T> | Err;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function err(
  code: ErrorCodeType,
  message: string,
  details?: Record<string, unknown>,
): Err {
  const error: AppError = details === undefined
    ? { code, message }
    : { code, message, details };
  return { ok: false, error };
}
