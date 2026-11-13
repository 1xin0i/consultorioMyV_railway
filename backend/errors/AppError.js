/** @format */

/**
 * Error de dominio con el código HTTP y el BODY EXACTO que debe recibir el cliente.
 * Se usa `payload` (y no solo `message`) para conservar los formatos históricos de la API:
 *   { error }  |  { error, codigo }  |  { status: "error", message }
 */
export class AppError extends Error {
  constructor(statusCode, payload) {
    super(payload?.error ?? payload?.message ?? "AppError");
    this.name = "AppError";
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

/**
 * Traduce un error capturado en un controller a la respuesta HTTP.
 * - AppError  -> su statusCode + payload.
 * - Otro      -> log + 500 con el body que cada endpoint ya devolvía.
 */
export const responderError = (res, error, logMensaje, cuerpo500) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(error.payload);
  }
  console.error(logMensaje, error);
  return res.status(500).json(cuerpo500);
};

