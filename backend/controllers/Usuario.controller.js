/** @format */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import sequelize from "../config/database.js";
import { Usuario } from "../models/Usuario.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura_myv_2026";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "clave_refresh_super_segura_myv_2026";

// Duraciones de tokens:
// Access token: 4 horas (cubre el turno completo de atención)
// Refresh token: 15 días (mantiene la sesión abierta sin interrupciones)
const ACCESS_TOKEN_EXP = "4h";
const REFRESH_TOKEN_EXP = "15d";

// Almacén en memoria de códigos de recuperación temporales
// Estructura: Map<codigo, { id_usuario, identificador, expira }>
const codigosRecuperacion = new Map();

// Limpieza periódica cada 10 minutos de códigos vencidos
setInterval(() => {
  const ahora = Date.now();
  for (const [codigo, data] of codigosRecuperacion.entries()) {
    if (data.expira < ahora) {
      codigosRecuperacion.delete(codigo);
    }
  }
}, 10 * 60 * 1000);

/**
 * Obtiene el transporter de nodemailer configurado según las variables de entorno.
 */
const getTransporter = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Asegura que exista al menos un usuario administrador u odontólogo.
 * Si la base de datos está vacía, genera automáticamente el usuario inicial 'admin'.
 */
const asegurarUsuarioPorDefecto = async () => {
  try {
    const cantidad = await Usuario.count();
    if (cantidad === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash("Admin123!", salt);
      await Usuario.create({
        nombre_usuario: "admin",
        contraseña: hashPassword,
        rol: "admin",
      });
      console.log(
        "[AUTH] Usuario inicial creado: usuario 'admin' / contraseña 'Admin123!'"
      );
    }
  } catch (err) {
    console.error("[AUTH] Error al verificar/crear usuario por defecto:", err.message);
  }
};

/**
 * Genera el par de tokens: Access Token (4h) y Refresh Token (15d).
 */
const generarTokens = (usuario) => {
  const payload = {
    id: usuario.id_usuario,
    nombre: usuario.nombre_usuario,
    rol: usuario.rol,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXP,
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXP,
  });

  return { token, refreshToken };
};

/**
 * 1. Login General / Maestro
 */
export const login = async (req, res) => {
  try {
    await asegurarUsuarioPorDefecto();

    const rawUser =
      req.body.identificador ||
      req.body.usuario ||
      req.body.nombre_usuario ||
      "";
    const rawPass =
      req.body.password ||
      req.body.contraseña ||
      req.body.contrasenia ||
      "";

    const nombre_usuario = rawUser.trim();
    const password = rawPass;

    if (!nombre_usuario || !password) {
      return res.status(400).json({
        status: "error",
        mensaje: "El usuario y la contraseña son requeridos",
      });
    }

    const usuario = await Usuario.findOne({
      where: { nombre_usuario },
    });

    if (!usuario) {
      return res.status(401).json({
        status: "error",
        mensaje: "Credenciales inválidas. Verificá tu usuario y contraseña.",
      });
    }

    const match = await bcrypt.compare(password, usuario.contraseña);
    if (!match) {
      return res.status(401).json({
        status: "error",
        mensaje: "Credenciales inválidas. Verificá tu usuario y contraseña.",
      });
    }

    const { token, refreshToken } = generarTokens(usuario);

    return res.status(200).json({
      status: "success",
      mensaje: "Inicio de sesión exitoso",
      token,
      refreshToken,
      expiraEn: ACCESS_TOKEN_EXP,
      refreshExpiraEn: REFRESH_TOKEN_EXP,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre_usuario,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error interno del servidor al iniciar sesión",
    });
  }
};

export const loginMaestro = login;

/**
 * 2. Refresco Silencioso de Token (Refresh Token)
 */
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const tokenHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader;

    const tokenRefresh =
      req.body.refreshToken || req.body.token || tokenHeader;

    if (!tokenRefresh) {
      return res.status(401).json({
        status: "error",
        mensaje: "Refresh token no proporcionado",
        code: "NO_REFRESH_TOKEN",
      });
    }

    jwt.verify(tokenRefresh, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: "error",
          mensaje:
            "Tu sesión ha caducado por inactividad. Por favor volvé a ingresar.",
          code: "REFRESH_EXPIRED",
        });
      }

      const usuario = await Usuario.findByPk(decoded.id);
      if (!usuario) {
        return res.status(401).json({
          status: "error",
          mensaje: "Usuario no encontrado",
          code: "USER_NOT_FOUND",
        });
      }

      const nuevosTokens = generarTokens(usuario);

      return res.status(200).json({
        status: "success",
        token: nuevosTokens.token,
        refreshToken: nuevosTokens.refreshToken,
        expiraEn: ACCESS_TOKEN_EXP,
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre_usuario,
          rol: usuario.rol,
        },
      });
    });
  } catch (error) {
    console.error("Error en refreshToken:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error interno al refrescar la sesión",
    });
  }
};

/**
 * 3. Obtener Usuario Actual (/me)
 */
export const obtenerUsuarioActual = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: "error",
        mensaje: "No autenticado",
      });
    }

    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ["id_usuario", "nombre_usuario", "rol"],
    });

    if (!usuario) {
      return res.status(404).json({
        status: "error",
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      status: "success",
      usuario,
    });
  } catch (error) {
    console.error("Error en obtenerUsuarioActual:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error al obtener perfil de usuario",
    });
  }
};

/**
 * 4. Solicitar Recuperación de Contraseña
 */
export const solicitarRecuperacionPassword = async (req, res) => {
  try {
    const rawUser = req.body.email || req.body.usuario || req.body.nombre_usuario || "";
    const identificador = rawUser.trim();

    if (!identificador) {
      return res.status(400).json({
        status: "error",
        mensaje: "El usuario o correo es obligatorio.",
      });
    }

    // Buscar el usuario: primero por nombre exacto, o por odontologo/primer usuario existente
    let usuario = await Usuario.findOne({ where: { nombre_usuario: identificador } });
    if (!usuario) {
      usuario = (await Usuario.findOne({ where: { rol: "odontologo" } })) || (await Usuario.findOne());
    }

    if (!usuario) {
      await asegurarUsuarioPorDefecto();
      usuario = await Usuario.findOne();
    }

    const pinRecuperacion = crypto.randomInt(100000, 1000000).toString();

    // Guardar en memoria el PIN asociado al id_usuario (válido por 15 min)
    codigosRecuperacion.set(pinRecuperacion, {
      id_usuario: usuario.id_usuario,
      identificador,
      expira: Date.now() + 15 * 60 * 1000,
    });

    console.log(
      `[AUTH] Código de recuperación generado para ${identificador} (Usuario ID: ${usuario.id_usuario}): [ ${pinRecuperacion} ]`
    );

    const transporter = getTransporter();

    // Si no está configurado Nodemailer en .env
    if (!transporter) {
      console.warn(
        `[AUTH] ⚠️ AVISO: EMAIL_USER o EMAIL_PASS no están configurados en backend/.env.`
      );
      console.warn(
        `[AUTH] ⚠️ Para pruebas en desarrollo, utilizá el PIN mostrado arriba: [ ${pinRecuperacion} ]`
      );

      return res.status(500).json({
        status: "error",
        mensaje:
          "El servicio de correo no está configurado en el servidor (.env: falta EMAIL_USER y/o EMAIL_PASS). Agregá tus credenciales en backend/.env para enviar correos reales.",
        codigoDev: pinRecuperacion,
      });
    }

    // Configurar y despachar el correo
    const emailRemitente = process.env.EMAIL_USER?.trim();
    const mailOptions = {
      from: `"Consultorio Odontológico M&V" <${emailRemitente}>`,
      to: identificador,
      subject: "Código de recuperación de contraseña - Consultorio M&V",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #2eb086; margin: 0; font-size: 22px; font-weight: 700;">Consultorio Odontológico M&V</h2>
            <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Recuperación de contraseña</p>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hola,</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Ingresá el siguiente código de verificación en la aplicación:</p>
          <div style="background-color: #f0fdf4; border: 1px dashed #2eb086; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <span style="font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tu código de verificación</span>
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #15803d; font-family: monospace;">${pinRecuperacion}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">Este código tiene una validez de <strong>15 minutos</strong>. Si vos no solicitaste este cambio, podés ignorar este correo con tranquilidad.</p>
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0 16px 0;" />
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">Sistema de Gestión Odontológica Consultorio M&V</p>
        </div>
      `,
      text: `Tu código de verificación para Consultorio Odontológico M&V es: ${pinRecuperacion}. Es válido por 15 minutos.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[AUTH] Correo de recuperación enviado con éxito a: ${identificador}`);

      return res.status(200).json({
        status: "success",
        mensaje: `Se envió un código de verificación a ${identificador}.`,
      });
    } catch (mailError) {
      console.error("[AUTH] Error al enviar email con Nodemailer:", mailError);
      return res.status(500).json({
        status: "error",
        mensaje:
          "Hubo un error al enviar el correo por Gmail. Verificá que la 'Contraseña de aplicación' de Google sea válida.",
        detalle: mailError.message,
        codigoDev: pinRecuperacion,
      });
    }
  } catch (error) {
    console.error("Error en solicitarRecuperacionPassword:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error al solicitar recuperación de contraseña",
    });
  }
};

/**
 * 5. Restablecer Contraseña
 */
export const restablecerPassword = async (req, res) => {
  try {
    const rawCodigo = req.body.codigo || req.body.token || req.body.pin || "";
    const codigo = rawCodigo.toString().trim();
    const rawPass =
      req.body.nueva_contraseña ||
      req.body.nuevaContrasenia ||
      req.body.password ||
      "";
    const nueva_contraseña = rawPass.toString();

    if (!codigo || codigo.length !== 6) {
      return res.status(400).json({
        status: "error",
        mensaje: "El código debe tener exactamente 6 dígitos numéricos.",
      });
    }

    if (!nueva_contraseña || nueva_contraseña.length < 6) {
      return res.status(400).json({
        status: "error",
        mensaje: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
    }

    const dataRecuperacion = codigosRecuperacion.get(codigo);

    if (!dataRecuperacion) {
      return res.status(400).json({
        status: "error",
        mensaje: "El código ingresado es incorrecto o ya ha expirado.",
      });
    }

    if (Date.now() > dataRecuperacion.expira) {
      codigosRecuperacion.delete(codigo);
      return res.status(400).json({
        status: "error",
        mensaje: "El código ha expirado. Por favor solicitá uno nuevo.",
      });
    }

    const usuario = await Usuario.findByPk(dataRecuperacion.id_usuario);
    if (!usuario) {
      return res.status(404).json({
        status: "error",
        mensaje: "Usuario no encontrado.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(nueva_contraseña, salt);

    await usuario.update({
      contraseña: hashPassword,
    });

    // Eliminar el código para que sea de un solo uso
    codigosRecuperacion.delete(codigo);

    console.log(
      `[AUTH] Contraseña restablecida con éxito para usuario '${usuario.nombre_usuario}' (ID: ${usuario.id_usuario})`
    );

    return res.status(200).json({
      status: "success",
      mensaje:
        "Contraseña actualizada exitosamente. Iniciá sesión con tus nuevas credenciales.",
    });
  } catch (error) {
    console.error("Error en restablecerPassword:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error interno al restablecer la contraseña",
    });
  }
};

/**
 * 6. Crear Usuario (Gestión / Administración)
 */
export const cambiarPassword = async (req, res) => {
  try {
    const id_usuario = req.user?.id;
    if (!id_usuario) {
      return res.status(401).json({
        status: "error",
        mensaje: "No autenticado",
      });
    }

    const { password_actual, nueva_password } = req.body;

    if (!password_actual || !nueva_password) {
      return res.status(400).json({
        status: "error",
        mensaje: "La contraseña actual y la nueva contraseña son requeridas.",
      });
    }

    if (nueva_password.length < 6) {
      return res.status(400).json({
        status: "error",
        mensaje: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
    }

    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({
        status: "error",
        mensaje: "Usuario no encontrado",
      });
    }

    const coincide = await bcrypt.compare(password_actual, usuario.contraseña);
    if (!coincide) {
      return res.status(400).json({
        status: "error",
        mensaje: "La contraseña actual ingresada es incorrecta.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const nuevaHash = await bcrypt.hash(nueva_password, salt);

    await usuario.update({
      contraseña: nuevaHash,
    });

    return res.status(200).json({
      status: "success",
      mensaje: "Contraseña actualizada exitosamente.",
    });
  } catch (error) {
    console.error("Error en cambiarPassword:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error interno al cambiar la contraseña",
    });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const { nombre_usuario, contraseña, rol } = req.body;

    const existe = await Usuario.findOne({ where: { nombre_usuario } });
    if (existe) {
      return res.status(400).json({
        status: "error",
        mensaje: "El nombre de usuario ya está registrado",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(contraseña, salt);

    const nuevoUsuario = await Usuario.create({
      nombre_usuario,
      contraseña: hashPassword,
      rol: rol || "odontologo",
    });

    return res.status(201).json({
      status: "success",
      mensaje: "Usuario creado exitosamente",
      data: {
        id_usuario: nuevoUsuario.id_usuario,
        nombre_usuario: nuevoUsuario.nombre_usuario,
        rol: nuevoUsuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en createUsuario:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error al crear el usuario",
    });
  }
};
