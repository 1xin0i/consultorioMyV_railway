/** @format */

import express from "express";
import {
  getConfiguracionAgenda,
  updateConfiguracionAgenda,
} from "../controllers/ConfiguracionAgenda.controller.js";

const router = express.Router();

router.get("/", getConfiguracionAgenda);
router.put("/", updateConfiguracionAgenda);

export default router;
