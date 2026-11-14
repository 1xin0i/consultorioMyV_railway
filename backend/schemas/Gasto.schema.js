/** @format */

import { z } from "zod";

const metodosPagoEnum = ["Efectivo", "Transferencia", "Tarjeta", "Otro"];

export const createGastoSchema = z
  .object({
    id_categoria_gasto: z.coerce.number().int().positive().optional(),
    id_categoria: z.coerce.number().int().positive().optional(),

    monto: z.coerce
      .number({
        required_error: "El monto es obligatorio",
        invalid_type_error: "El monto debe ser numérico",
      })
      .positive("El monto debe ser mayor a 0"),

    concepto: z.string().trim().min(2, "El concepto debe tener al menos 2 caracteres").max(255).optional(),
    detalle: z.string().trim().min(2, "El detalle debe tener al menos 2 caracteres").max(255).optional(),

    fecha_gasto: z.coerce
      .date({
        invalid_type_error: "Formato de fecha inválido",
      })
      .optional(),

    metodo_pago: z
      .enum(metodosPagoEnum, {
        errorMap: () => ({
          message:
            "Método de pago inválido (Efectivo, Transferencia, Tarjeta, Otro)",
        }),
      })
      .default("Efectivo"),
  })
  .refine((data) => data.id_categoria_gasto || data.id_categoria, {
    message: "La categoría del gasto es obligatoria",
    path: ["id_categoria_gasto"],
  })
  .refine((data) => data.concepto || data.detalle, {
    message: "El concepto o detalle del gasto es obligatorio",
    path: ["concepto"],
  })
  .transform((data) => ({
    ...data,
    id_categoria_gasto: data.id_categoria_gasto || data.id_categoria,
    concepto: data.concepto || data.detalle,
  }));

export const updateGastoSchema = z
  .object({
    id_categoria_gasto: z.coerce.number().int().positive().optional(),
    id_categoria: z.coerce.number().int().positive().optional(),

    monto: z.coerce.number().positive("El monto debe ser mayor a 0").optional(),

    concepto: z
      .string()
      .trim()
      .min(2, "El concepto debe tener al menos 2 caracteres")
      .max(255)
      .optional(),
    detalle: z
      .string()
      .trim()
      .min(2, "El detalle debe tener al menos 2 caracteres")
      .max(255)
      .optional(),

    fecha_gasto: z.coerce
      .date({
        invalid_type_error: "Formato de fecha inválido",
      })
      .optional(),

    metodo_pago: z.enum(metodosPagoEnum).optional(),
  })
  .transform((data) => ({
    ...data,
    ...(data.id_categoria_gasto || data.id_categoria
      ? { id_categoria_gasto: data.id_categoria_gasto || data.id_categoria }
      : {}),
    ...(data.concepto || data.detalle
      ? { concepto: data.concepto || data.detalle }
      : {}),
  }));
