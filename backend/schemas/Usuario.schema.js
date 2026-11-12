/** @format */

import { z } from "zod";

const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9_\s.-]+$/;
const rolesValidos = ["admin", "odontologo"];

const emailOpcionalSchema = z
  .preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      const trimmed = String(val).trim();
      return trimmed === "" ? null : trimmed.toLowerCase();
    },
    z.string().email("Formato de correo electrónico inválido").nullable().optional(),
  );

export const loginSchema = z
  .object({
    identificador: z.string().trim().optional(),
    nombre_usuario: z.string().trim().optional(),
    usuario: z.string().trim().optional(),
    email: z.string().trim().optional(),
    contraseña: z.string().optional(),
    contrasenia: z.string().optional(),
    password: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(
        (data.identificador && data.identificador.trim()) ||
          (data.nombre_usuario && data.nombre_usuario.trim()) ||
          (data.usuario && data.usuario.trim()) ||
          (data.email && data.email.trim()),
      ),
    {
      message: "El nombre de usuario o correo es obligatorio",
      path: ["usuario"],
    },
  )
  .refine(
    (data) => Boolean(data.contraseña || data.contrasenia || data.password),
    {
      message: "La contraseña es obligatoria",
      path: ["password"],
    },
  )
  .transform((data) => {
    const ident = (
      data.identificador ||
      data.nombre_usuario ||
      data.usuario ||
      data.email ||
      ""
    ).trim();
    const pass = data.contraseña || data.contrasenia || data.password || "";
    return {
      identificador: ident,
      usuario: ident,
      nombre_usuario: ident,
      password: pass,
      contraseña: pass,
    };
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const recuperarPasswordSchema = z
  .object({
    identificador: z.string().trim().optional(),
    email: z.string().trim().optional(),
    usuario: z.string().trim().optional(),
    nombre_usuario: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      Boolean(
        (data.identificador && data.identificador.trim()) ||
          (data.email && data.email.trim()) ||
          (data.usuario && data.usuario.trim()) ||
          (data.nombre_usuario && data.nombre_usuario.trim()),
      ),
    {
      message: "El usuario o correo electrónico es obligatorio",
      path: ["identificador"],
    },
  )
  .transform((data) => {
    const identificador = (
      data.identificador ||
      data.email ||
      data.usuario ||
      data.nombre_usuario ||
      ""
    ).trim();
    return {
      identificador,
      email: identificador,
    };
  });

export const restablecerPasswordSchema = z
  .object({
    codigo: z.string().optional(),
    token: z.string().optional(),
    pin: z.string().optional(),
    nueva_contraseña: z.string().optional(),
    nuevaContrasenia: z.string().optional(),
    password: z.string().optional(),
  })
  .refine(
    (data) => {
      const cod = (data.codigo || data.token || data.pin || "")
        .toString()
        .trim();
      return /^\d{6}$/.test(cod);
    },
    {
      message: "El código debe tener exactamente 6 dígitos numéricos",
      path: ["codigo"],
    },
  )
  .superRefine((data, ctx) => {
    const pass = (
      data.nueva_contraseña ||
      data.nuevaContrasenia ||
      data.password ||
      ""
    ).toString();

    if (pass.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La contraseña debe tener al menos 8 caracteres",
        path: ["nueva_contraseña"],
      });
    }
    if (!/[A-Z]/.test(pass)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe contener al menos una letra mayúscula",
        path: ["nueva_contraseña"],
      });
    }
    if (!/[a-z]/.test(pass)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe contener al menos una letra minúscula",
        path: ["nueva_contraseña"],
      });
    }
    if (!/[0-9]/.test(pass)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe contener al menos un número",
        path: ["nueva_contraseña"],
      });
    }
    if (!/[^A-Za-z0-9]/.test(pass)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe contener al menos un carácter especial",
        path: ["nueva_contraseña"],
      });
    }
  })
  .transform((data) => {
    const cod = (data.codigo || data.token || data.pin || "").toString().trim();
    return {
      codigo: cod,
      token: cod,
      nueva_contraseña:
        data.nueva_contraseña || data.nuevaContrasenia || data.password,
    };
  });

export const createUsuarioSchema = z.object({
  nombre_usuario: z
    .string({ required_error: "El nombre de usuario es obligatorio" })
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(regex, "Caracteres no permitidos en el nombre de usuario"),
  contraseña: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100)
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  email: emailOpcionalSchema,
  rol: z.enum(rolesValidos).optional(),
});

export const updateUsuarioSchema = z.object({
  nombre_usuario: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(regex, "Caracteres no permitidos en el nombre de usuario")
    .optional(),
  contraseña: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100)
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial")
    .optional(),
  email: emailOpcionalSchema,
  rol: z.enum(rolesValidos).optional(),
});

export const loginMaestroSchema = loginSchema;
