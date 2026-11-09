/** @format */

import { optional, z } from "zod";

const hoy = new Date();

export const createTurnoSchema = z
  .object({
    id_paciente: z
      .number({
        required_error: "El ID del paciente es obligatorio",
        invalid_type_error: "El ID del paciente debe ser un número",
      })
      .int("El ID debe ser un número entero")
      .positive("El ID no es válido"),

    fecha_hora_inicio: z.coerce.date({
      invalid_type_error: "Formato de fecha inválido",
    }),

    fecha_hora_fin: z.coerce
      .date({
        invalid_type_error: "Formato de fecha inválido",
      })
      .optional(),

    duracion_minutos: z
      .number({
        invalid_type_error: "La duración debe ser un número",
      })
      .int("La duración debe ser un número entero")
      .positive("La duración debe ser mayor a 0")
      .optional(),

    precio_final: z
      .number({
        required_error: "El precio final es obligatorio",
        invalid_type_error: "El precio final debe ser un número",
      })
      .nonnegative("El precio final debe ser mayor o igual a 0")
      .refine((val) => Number.isInteger(val * 100), {
        message: "El precio no puede tener más de 2 decimales",
      }),

    notas_consulta: z
      .string({ invalid_type_error: "Las notas de consulta deben ser un texto" })
      .trim()
      .nullish(),
  })
  .refine((data) => data.fecha_hora_fin || data.duracion_minutos, {
    message: "Debe proporcionar fecha_hora_fin o duracion_minutos",
    path: ["fecha_hora_fin"],
  })
  .transform((data) => {
    if (!data.fecha_hora_fin && data.duracion_minutos && data.fecha_hora_inicio) {
      data.fecha_hora_fin = new Date(
        new Date(data.fecha_hora_inicio).getTime() + data.duracion_minutos * 60000
      );
    }
    return data;
  });

export const updateTurnoSchema = z.object({
  id_paciente: z
    .number({
      required_error: "El ID del paciente es obligatorio",
      invalid_type_error: "El ID del paciente debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido")
    .optional(),

  precio_final: z
    .number({
      required_error: "El precio final es obligatorio",
      invalid_type_error: "El precio final debe ser un número",
    })
    .nonnegative("El precio final debe ser mayor o igual a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El precio no puede tener más de 2 decimales",
    })
    .optional(),

  notas_consulta: z
    .string({ invalid_type_error: "Las notas de consulta deben ser un texto" })
    .trim()
    .nullish(),
});

export const atenderTurnoSchema = z.object({
  id_paciente: z
    .number({
      required_error: "El ID del paciente es obligatorio",
      invalid_type_error: "El ID del paciente debe ser un número",
    })
    .int("El ID debe ser un número entero")
    .positive("El ID no es válido")
    .optional(),

  fecha_hora_inicio: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de inicio no es válida" })
    .optional(),

  fecha_hora_fin: z.coerce
    .date({
      invalid_type_error: "Formato de fecha inválido",
    })
    .min(hoy, { message: "La fecha de fin no es válida" })
    .optional(),

  precio_final: z
    .number({
      required_error: "El precio final es obligatorio",
      invalid_type_error: "El precio final debe ser un número",
    })
    .positive("El precio final debe ser mayor a 0")
    .refine((val) => Number.isInteger(val * 100), {
      message: "El precio no puede tener más de 2 decimales",
    })
    .optional(),

  notas_consulta: z
    .string({ invalid_type_error: "Las notas de consulta deben ser un texto" })
    .trim()
    .nullish(),

  practicas_realizadas: z
    .array(z.number(), {
      invalid_type_error: "Las prácticas realizadas deben venir en un array",
    })
    .optional(),

  obras_sociales: z
    .array(z.number().nullable(), {
      invalid_type_error: "Las obras sociales deben venir en un array",
    })
    .nullish(),
});
