/** @format */

import express from "express";
import * as CobroController from "../controllers/Cobro.controller.js";

import { Paciente, Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import { createCobroSchema, updateCobroSchema } from "../schemas/Cobro.schema.js";

const router = express.Router();

// Rutas para Cobro y SolicitudCobro
router.get("/", CobroController.getAllCobros);

router.get("/:turnoId/cobros", CobroController.getCobroByTurnoId);

router.get("/:id", CobroController.getCobroById);

router.post(
  "/",
  validateSchema(createCobroSchema),
  CobroController.createCobro,
);

router.post(
  "/inmediato",
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
  CobroController.createCobroInmediato,
);

router.post(
  "/informal",
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
  CobroController.createCobroInformal,
);

router.post("/registrar-pago", CobroController.registrarPagoTurno);

router.put(
  "/:id",
  validateSchema(updateCobroSchema),
  CobroController.updateCobro,
);

router.patch("/:id/delete", CobroController.deleteCobro);

export default router;
