/** @format */

import express from "express";
const router = express.Router();

import * as UsuarioController from "../controllers/Usuario.controller.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  pinRateLimiter,
  authRateLimiter,
  mailResetLimiter,
  verifyCodeLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  loginSchema,
  createUsuarioSchema,
  updateUsuarioSchema,
  recuperarPasswordSchema,
  restablecerPasswordSchema,
  validarPinSchema,
  verificarPasswordSchema,
  recuperarPinSchema,
} from "../schemas/Usuario.schema.js";

// 1. Autenticación y Sesión
router.post("/login", validateSchema(loginSchema), UsuarioController.login);
router.post(
  "/login-maestro",
  validateSchema(loginSchema),
  UsuarioController.login,
);
router.post("/refresh-token", UsuarioController.refreshToken);
router.post("/refreshToken", UsuarioController.refreshToken);
router.post("/refresh", UsuarioController.refreshToken);

// 1.1. Seguridad y Desbloqueo por PIN de 4 dígitos
router.post(
  "/validar-pin",
  pinRateLimiter,
  validateSchema(validarPinSchema),
  UsuarioController.validarPin,
);
router.post(
  "/verificar-password",
  authRateLimiter,
  validateSchema(verificarPasswordSchema),
  UsuarioController.verificarPassword,
);
router.post(
  "/recuperar-pin",
  authRateLimiter,
  validateSchema(recuperarPinSchema),
  UsuarioController.recuperarPin,
);
router.post(
  "/cambiar-pin",
  verificarToken,
  validateSchema(recuperarPinSchema),
  UsuarioController.recuperarPin,
);

// 2. Perfil de Usuario Autenticado
router.get("/me", verificarToken, UsuarioController.obtenerUsuarioActual);
router.put(
  "/cambiar-password",
  verificarToken,
  UsuarioController.cambiarPassword,
);

// 3. Recuperación de Contraseña por Correo (con Rate Limiters anti-spam y anti-fuerza bruta)
router.post(
  "/recuperar-password",
  mailResetLimiter,
  validateSchema(recuperarPasswordSchema),
  UsuarioController.solicitarRecuperacionPassword,
);
router.post(
  "/restablecer-password",
  verifyCodeLimiter,
  validateSchema(restablecerPasswordSchema),
  UsuarioController.restablecerPassword,
);

// 4. Registro y Gestión de Usuarios
router.post(
  "/registro",
  validateSchema(createUsuarioSchema),
  UsuarioController.createUsuario,
);
router.post(
  "/",
  validateSchema(createUsuarioSchema),
  UsuarioController.createUsuario,
);
router.put(
  "/:id",
  verificarToken,
  validateSchema(updateUsuarioSchema),
  UsuarioController.updateUsuario,
);

export default router;
