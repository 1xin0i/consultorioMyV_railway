/** @format */

import { z } from "zod";

const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9_\s.-]+$/;
const rolesValidos = ["admin", "odontologo"];

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
          (data.email && data.email.trim())
      ),
    {
      message: "El nombre de usuario es obligatorio",
      path: ["usuario"],
    }
  )
  .refine(
    (data) =>
      Boolean(data.contraseña || data.contrasenia || data.password),
    {
      message: "La contraseña es obligatoria",
      path: ["password"],
    }
  )
  .transform((data) => ({
    identificador: (
      data.identificador ||
      data.nombre_usuario ||
      data.usuario ||
      data.email ||
      ""
    ).trim(),
    usuario: (
      data.identificador ||
      data.nombre_usuario ||
      data.usuario ||
      data.email ||
      ""
    ).trim(),
    nombre_usuario: (
      data.identificador ||
      data.nombre_usuario ||
      data.usuario ||
      data.email ||
      ""
    ).trim(),
    password: data.contraseña || data.contrasenia || data.password || "",
    contraseña: data.contraseña || data.contrasenia || data.password || "",
  }));

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const recuperarPasswordSchema = z.object({
  email: z
    .string({ required_error: "El correo es obligatorio" })
    .trim()
    .email("Formato de correo inválido"),
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
      const cod = (data.codigo || data.token || data.pin || "").toString().trim();
      return /^\d{6}$/.test(cod);
    },
    {
      message: "El código debe tener exactamente 6 dígitos numéricos",
      path: ["codigo"],
    }
  )
  .refine(
    (data) => {
      const pass =
        data.nueva_contraseña || data.nuevaContrasenia || data.password || "";
      return pass.length >= 6;
    },
    {
      message: "La contraseña debe tener al menos 6 caracteres",
      path: ["nueva_contraseña"],
    }
  )
  .transform((data) => ({
    codigo: (data.codigo || data.token || data.pin || "").toString().trim(),
    nueva_contraseña:
      data.nueva_contraseña || data.nuevaContrasenia || data.password,
  }));

export const createUsuarioSchema = z.object({
  nombre_usuario: z
    .string({ required_error: "El nombre de usuario es obligatorio" })
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(regex, "Caracteres no permitidos en el nombre de usuario"),
  contraseña: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100),
  rol: z.enum(rolesValidos).optional(),
});

export const updateUsuarioSchema = createUsuarioSchema.partial();
export const loginMaestroSchema = loginSchema;
