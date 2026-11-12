/** @format */

import express from "express";
const router = express.Router();

import * as UsuarioController from "../controllers/Usuario.controller.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { verificarToken } from "../middleware/auth.middleware.js";
import {
  mailResetLimiter,
  verifyCodeLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  loginSchema,
  createUsuarioSchema,
  updateUsuarioSchema,
  recuperarPasswordSchema,
  restablecerPasswordSchema,
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
