/** @format */

import express from "express";
import { getFeriados } from "../controllers/Feriado.controller.js";

const router = express.Router();

router.get("/:anio", getFeriados);

export default router;
