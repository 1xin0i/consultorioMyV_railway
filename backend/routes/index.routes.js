/** @format */

import express from "express";
const router = express.Router();

// Importar middleware de autenticación
import { verificarToken } from "../middleware/auth.middleware.js";

// Importar las rutas de los diferentes recursos
import UsuarioRoutes from "./Usuario.routes.js";
import CobroRoutes from "./Cobro.routes.js";
import EstadoRoutes from "./EstadoTurno.routes.js";
import HistorialEstadoTurnoRoutes from "./HistorialEstadoTurno.routes.js";
import ObraSocialRoutes from "./ObraSocial.routes.js";
import PacienteRoutes from "./Paciente.routes.js";
import PacienteObraSocialRoutes from "./PacienteObraSocial.routes.js";
import PracticaRoutes from "./Practica.routes.js";
import PracticaTurnoRoutes from "./PracticaTurno.routes.js";
import TurnoRoutes from "./Turno.routes.js";
import GastoRoutes from "./Gasto.routes.js";
import CategoriaGastoRoutes from "./CategoriaGasto.routes.js";
import CajaRoutes from "./Caja.routes.js";
import ConfiguracionAgendaRoutes from "./ConfiguracionAgenda.routes.js";
import RestriccionAgendaRoutes from "./RestriccionAgenda.routes.js";

// ─── RUTAS PÚBLICAS (AUTENTICACIÓN) ──────────────────────────────────
router.use("/api/auth", UsuarioRoutes);
router.use("/api/usuarios", UsuarioRoutes);

// ─── RUTAS PROTEGIDAS CON VERIFICACIÓN DE TOKEN JWT ──────────────────
router.use("/api/cobros", verificarToken, CobroRoutes);
router.use("/api/estados", verificarToken, EstadoRoutes);
router.use("/api/historial-estado-turnos", verificarToken, HistorialEstadoTurnoRoutes);
router.use("/api/obras-sociales", verificarToken, ObraSocialRoutes);
router.use("/api/pacientes", verificarToken, PacienteRoutes);
router.use("/api/pacientes-por-obras-sociales", verificarToken, PacienteObraSocialRoutes);
router.use("/api/practicas", verificarToken, PracticaRoutes);
router.use("/api/practicas-turnos", verificarToken, PracticaTurnoRoutes);
router.use("/api/turnos", verificarToken, TurnoRoutes);
router.use("/api/gastos", verificarToken, GastoRoutes);
router.use("/api/categorias-gastos", verificarToken, CategoriaGastoRoutes);
router.use("/api/caja", verificarToken, CajaRoutes);
router.use("/api/configuracion-agenda", verificarToken, ConfiguracionAgendaRoutes);
router.use("/api/restricciones-agenda", verificarToken, RestriccionAgendaRoutes);

export default router;
