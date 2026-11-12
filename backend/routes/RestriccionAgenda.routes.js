/** @format */

import express from "express";
import {
  getRestriccionesAgenda,
  createRestriccionAgenda,
  deleteRestriccionAgenda,
} from "../controllers/ConfiguracionAgenda.controller.js";

const router = express.Router();

router.get("/", getRestriccionesAgenda);
router.post("/", createRestriccionAgenda);
router.delete("/:id", deleteRestriccionAgenda);

export default router;
