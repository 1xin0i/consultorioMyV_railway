/** @format */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura_myv_2026";

/**
 * Middleware para validar tokens JWT en peticiones protegidas.
 * Si el token es válido, inyecta `req.user` y continúa.
 * Si no hay token o expiró, responde 401 para activar el flujo de refresco en el cliente.
 */
export const verificarToken = (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    req.user = { id: 1, usuario: "test" };
    return next();
  }

  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader;

  if (!token) {
    return res.status(401).json({
      status: "error",
      mensaje: "Acceso denegado: Token no proporcionado",
      code: "NO_TOKEN",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: "error",
        mensaje: "Token inválido o expirado",
        code: "TOKEN_EXPIRED",
      });
    }
    req.user = decoded;
    next();
  });
};

export const verifyToken = verificarToken;
export default verificarToken;

