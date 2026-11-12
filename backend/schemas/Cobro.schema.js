/** @format */

import { z } from "zod";

export const createCobroSchema = z.object({
  id_turno: z.coerce.number().int().positive().optional().nullable(),
  turno_id: z.coerce.number().int().positive().optional().nullable(),
  id_paciente: z.coerce.number().int().positive().optional(),
  paciente_id: z.coerce.number().int().positive().optional(),
  solicitud_cobro_id: z.coerce.number().int().positive().optional(),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0").optional(),
  monto_a_cobrar: z.coerce
    .number()
    .positive("El monto a cobrar debe ser mayor a 0")
    .optional(),
  metodo_pago: z.string().optional(),
  metodo_pago_id: z.coerce.number().int().positive().optional(),
  observaciones: z.string().trim().max(255).optional().nullable(),
});

export const updateCobroSchema = z.object({
  monto: z.coerce.number().positive("El monto debe ser mayor a 0").optional(),
  monto_a_cobrar: z.coerce
    .number()
    .positive("El monto a cobrar debe ser mayor a 0")
    .optional(),
  metodo_pago: z.string().optional(),
  metodo_pago_id: z.coerce.number().int().positive().optional(),
  observaciones: z.string().trim().max(255).optional().nullable(),
});
