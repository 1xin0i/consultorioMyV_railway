/** @format */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Usuario } from "../models/Usuario.model.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "clave_secreta_super_segura_myv_2026";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "clave_refresh_super_segura_myv_2026";

// Duraciones de tokens:
// Access token: 4 horas (cubre el turno completo de atención)
// Refresh token: 15 días (mantiene la sesión abierta sin interrupciones)
const ACCESS_TOKEN_EXP = "4h";
const REFRESH_TOKEN_EXP = "15d";

const MENSAJE_RECUPERACION_GENERICO =
  "Si los datos coinciden con una cuenta registrada, se enviarán las instrucciones al correo asociado.";

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
      const emailDefault =
        process.env.ADMIN_RECOVERY_EMAIL?.trim() ||
        process.env.EMAIL_USER?.trim() ||
        null;
      await Usuario.create({
        nombre_usuario: "admin",
        contraseña: hashPassword,
        email: emailDefault,
        rol: "admin",
      });
      console.log(
        "[AUTH] Usuario inicial creado: usuario 'admin' / contraseña 'Admin123!'",
      );
    }
  } catch (err) {
    console.error(
      "[AUTH] Error al verificar/crear usuario por defecto:",
      err.message,
    );
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
 * 1. Login General / Maestro (por nombre de usuario o email)
 */
export const login = async (req, res) => {
  try {
    await asegurarUsuarioPorDefecto();

    const rawUser =
      req.body.identificador ||
      req.body.usuario ||
      req.body.nombre_usuario ||
      req.body.email ||
      "";
    const rawPass =
      req.body.password ||
      req.body.contraseña ||
      req.body.contrasenia ||
      "";

    const identificador = rawUser.trim();
    const password = rawPass;

    if (!identificador || !password) {
      return res.status(400).json({
        status: "error",
        mensaje: "El usuario y la contraseña son requeridos",
      });
    }

    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { nombre_usuario: identificador },
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("email")),
            identificador.toLowerCase(),
          ),
        ],
      },
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

    // Guardar el refreshToken activo en el usuario para poder invalidarlo ante cambio de clave
    usuario.refresh_token = refreshToken;
    await usuario.save();

    return res.status(200).json({
      status: "success",
      mensaje: "Inicio de sesión exitoso",
      token,
      refreshToken,
      expiraEn: ACCESS_TOKEN_EXP,
      refreshExpiraEn: REFRESH_TOKEN_EXP,
      usuario: {
        id: usuario.id_usuario,
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre_usuario,
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.email || null,
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
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
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

      // Si el refresh_token fue anulado tras restablecer/cambiar contraseña, rechazar la renovación
      if (
        usuario.refresh_token === "REVOKED" ||
        (usuario.refresh_token && usuario.refresh_token !== tokenRefresh)
      ) {
        return res.status(401).json({
          status: "error",
          mensaje:
            "Tu sesión fue cerrada por un cambio de credenciales. Por favor volvé a ingresar.",
          code: "SESSION_REVOKED",
        });
      }

      const nuevosTokens = generarTokens(usuario);
      usuario.refresh_token = nuevosTokens.refreshToken;
      await usuario.save();

      return res.status(200).json({
        status: "success",
        token: nuevosTokens.token,
        refreshToken: nuevosTokens.refreshToken,
        expiraEn: ACCESS_TOKEN_EXP,
        usuario: {
          id: usuario.id_usuario,
          id_usuario: usuario.id_usuario,
          nombre: usuario.nombre_usuario,
          nombre_usuario: usuario.nombre_usuario,
          email: usuario.email || null,
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
      attributes: ["id_usuario", "nombre_usuario", "email", "rol"],
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
 * 4. Solicitar Recuperación de Contraseña (búsqueda por usuario o email con Op.or)
 */
export const solicitarRecuperacionPassword = async (req, res) => {
  try {
    const rawIdentificador =
      req.body.identificador ||
      req.body.email ||
      req.body.usuario ||
      req.body.nombre_usuario ||
      "";
    const identificador = rawIdentificador.trim();

    if (!identificador) {
      return res.status(400).json({
        status: "error",
        mensaje: "El usuario o correo electrónico es obligatorio.",
      });
    }

    const identificadorLower = identificador.toLowerCase();

    // Buscar al usuario tanto por nombre_usuario como por email (Op.or)
    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { nombre_usuario: identificador },
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("nombre_usuario")),
            identificadorLower,
          ),
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("email")),
            identificadorLower,
          ),
        ],
      },
    });

    // Respuesta genérica si no existe para no filtrar qué usuarios o emails están registrados
    if (!usuario) {
      console.log(
        `[AUTH] Solicitud de recuperación para identificador no registrado: ${identificador}`,
      );
      return res.status(200).json({
        status: "success",
        mensaje: MENSAJE_RECUPERACION_GENERICO,
      });
    }

    const pinRecuperacion = crypto.randomInt(100000, 1000000).toString();

    // Persistir PIN y expiración (15 minutos) en la base de datos
    usuario.reset_token = pinRecuperacion;
    usuario.reset_token_expires = new Date(Date.now() + 15 * 60 * 1000);
    await usuario.save();

    // Correo destino: prioriza usuario.email, con fallback a ADMIN_RECOVERY_EMAIL o EMAIL_USER
    const destinoEmail =
      usuario.email?.trim() ||
      process.env.ADMIN_RECOVERY_EMAIL?.trim() ||
      process.env.EMAIL_USER?.trim() ||
      null;

    console.log(
      `[AUTH] Código de recuperación generado para usuario '${usuario.nombre_usuario}' (ID: ${usuario.id_usuario}, destino: ${destinoEmail || "consola"}): [ ${pinRecuperacion} ]`,
    );

    const transporter = getTransporter();

    // Fallback en desarrollo cuando EMAIL_USER o EMAIL_PASS no están definidos en .env
    if (!transporter || !destinoEmail) {
      console.warn(
        `[AUTH] ⚠️ AVISO: EMAIL_USER / EMAIL_PASS (o correo destino) no están configurados en backend/.env.`,
      );
      console.warn(
        `[AUTH] ⚠️ Para pruebas en desarrollo, utilizá el PIN de 6 dígitos generado arriba: [ ${pinRecuperacion} ]`,
      );

      return res.status(200).json({
        status: "success",
        mensaje: MENSAJE_RECUPERACION_GENERICO,
      });
    }

    const emailRemitente = process.env.EMAIL_USER?.trim();
    const mailOptions = {
      from: `"Consultorio Odontológico M&V" <${emailRemitente}>`,
      to: destinoEmail,
      subject: "Código de recuperación de contraseña - Consultorio M&V",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #2eb086; margin: 0; font-size: 22px; font-weight: 700;">Consultorio Odontológico M&V</h2>
            <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Recuperación de contraseña</p>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hola <strong>${usuario.nombre_usuario}</strong>,</p>
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
      console.log(
        `[AUTH] Correo de recuperación enviado con éxito a: ${destinoEmail}`,
      );
    } catch (mailError) {
      console.error("[AUTH] Error al enviar email con Nodemailer:", mailError);
      return res.status(500).json({
        status: "error",
        mensaje:
          "Hubo un error al despachar el correo de recuperación. Verificá la configuración del servidor de correo.",
      });
    }

    return res.status(200).json({
      status: "success",
      mensaje: MENSAJE_RECUPERACION_GENERICO,
    });
  } catch (error) {
    console.error("Error en solicitarRecuperacionPassword:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error al solicitar recuperación de contraseña",
    });
  }
};

/**
 * 5. Restablecer Contraseña consumiendo el PIN de 6 dígitos persistido en DB
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

    if (!codigo || !/^\d{6}$/.test(codigo)) {
      return res.status(400).json({
        status: "error",
        mensaje: "El código debe tener exactamente 6 dígitos numéricos.",
      });
    }

    if (
      nueva_contraseña.length < 8 ||
      !/[A-Z]/.test(nueva_contraseña) ||
      !/[a-z]/.test(nueva_contraseña) ||
      !/[0-9]/.test(nueva_contraseña) ||
      !/[^A-Za-z0-9]/.test(nueva_contraseña)
    ) {
      return res.status(400).json({
        status: "error",
        mensaje:
          "La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y carácter especial.",
      });
    }

    const usuario = await Usuario.findOne({
      where: {
        reset_token: codigo,
        reset_token_expires: { [Op.gt]: new Date() },
      },
    });

    if (!usuario) {
      return res.status(400).json({
        status: "error",
        mensaje: "El código ingresado es incorrecto o ya ha expirado.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(nueva_contraseña, salt);

    usuario.contraseña = hashPassword;
    usuario.reset_token = null;
    usuario.reset_token_expires = null;
    // Anular refresh_token para invalidar sesiones abiertas en otros dispositivos
    usuario.refresh_token = "REVOKED";
    await usuario.save();

    console.log(
      `[AUTH] Contraseña restablecida con éxito para usuario '${usuario.nombre_usuario}' (ID: ${usuario.id_usuario})`,
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
 * 6. Cambiar Contraseña y/o Correo de Recuperación (Usuario autenticado)
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

    const { password_actual, nueva_password, email } = req.body;

    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({
        status: "error",
        mensaje: "Usuario no encontrado",
      });
    }

    if (!password_actual) {
      return res.status(400).json({
        status: "error",
        mensaje: "La contraseña actual es requerida para confirmar los cambios.",
      });
    }

    const coincide = await bcrypt.compare(password_actual, usuario.contraseña);
    if (!coincide) {
      return res.status(400).json({
        status: "error",
        mensaje: "La contraseña actual ingresada es incorrecta.",
      });
    }

    // Procesar actualización opcional de email
    if (email !== undefined) {
      const emailNormalizado =
        email === null || String(email).trim() === ""
          ? null
          : String(email).trim().toLowerCase();

      if (
        emailNormalizado &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)
      ) {
        return res.status(400).json({
          status: "error",
          mensaje: "Formato de correo electrónico inválido.",
        });
      }

      if (emailNormalizado && emailNormalizado !== usuario.email) {
        const existeEmail = await Usuario.findOne({
          where: {
            email: emailNormalizado,
            id_usuario: { [Op.ne]: id_usuario },
          },
        });
        if (existeEmail) {
          return res.status(400).json({
            status: "error",
            mensaje:
              "Ese correo electrónico ya está asociado a otro usuario.",
          });
        }
      }

      usuario.email = emailNormalizado;
    }

    // Procesar cambio de contraseña si se proporcionó nueva_password
    if (nueva_password && String(nueva_password).trim() !== "") {
      const passStr = String(nueva_password);
      if (
        passStr.length < 8 ||
        !/[A-Z]/.test(passStr) ||
        !/[a-z]/.test(passStr) ||
        !/[0-9]/.test(passStr) ||
        !/[^A-Za-z0-9]/.test(passStr)
      ) {
        return res.status(400).json({
          status: "error",
          mensaje:
            "La nueva contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y carácter especial.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      usuario.contraseña = await bcrypt.hash(passStr, salt);
      usuario.refresh_token = "REVOKED";
    }

    await usuario.save();

    return res.status(200).json({
      status: "success",
      mensaje: nueva_password
        ? "Credenciales actualizadas exitosamente."
        : "Correo de recuperación actualizado exitosamente.",
      usuario: {
        id: usuario.id_usuario,
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre_usuario,
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.email || null,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en cambiarPassword:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error interno al actualizar los datos de la cuenta",
    });
  }
};

/**
 * 7. Crear Usuario (Gestión / Administración)
 */
export const createUsuario = async (req, res) => {
  try {
    const { nombre_usuario, contraseña, email, rol } = req.body;

    const existe = await Usuario.findOne({ where: { nombre_usuario } });
    if (existe) {
      return res.status(400).json({
        status: "error",
        mensaje: "El nombre de usuario ya está registrado",
      });
    }

    const emailNormalizado =
      email && String(email).trim() !== ""
        ? String(email).trim().toLowerCase()
        : null;

    if (emailNormalizado) {
      const existeEmail = await Usuario.findOne({
        where: { email: emailNormalizado },
      });
      if (existeEmail) {
        return res.status(400).json({
          status: "error",
          mensaje: "El correo electrónico ya está registrado",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(contraseña, salt);

    const nuevoUsuario = await Usuario.create({
      nombre_usuario,
      contraseña: hashPassword,
      email: emailNormalizado,
      rol: rol || "odontologo",
    });

    return res.status(201).json({
      status: "success",
      mensaje: "Usuario creado exitosamente",
      data: {
        id_usuario: nuevoUsuario.id_usuario,
        nombre_usuario: nuevoUsuario.nombre_usuario,
        email: nuevoUsuario.email,
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

/**
 * 8. Actualizar Usuario (Administración / Edición)
 */
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_usuario, contraseña, email, rol } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({
        status: "error",
        mensaje: "Usuario no encontrado",
      });
    }

    if (nombre_usuario && nombre_usuario !== usuario.nombre_usuario) {
      const existeNombre = await Usuario.findOne({
        where: {
          nombre_usuario,
          id_usuario: { [Op.ne]: id },
        },
      });
      if (existeNombre) {
        return res.status(400).json({
          status: "error",
          mensaje: "El nombre de usuario ya está registrado",
        });
      }
      usuario.nombre_usuario = nombre_usuario;
    }

    if (email !== undefined) {
      const emailNormalizado =
        email === null || String(email).trim() === ""
          ? null
          : String(email).trim().toLowerCase();

      if (emailNormalizado && emailNormalizado !== usuario.email) {
        const existeEmail = await Usuario.findOne({
          where: {
            email: emailNormalizado,
            id_usuario: { [Op.ne]: id },
          },
        });
        if (existeEmail) {
          return res.status(400).json({
            status: "error",
            mensaje: "El correo electrónico ya está registrado",
          });
        }
      }
      usuario.email = emailNormalizado;
    }

    if (rol) {
      usuario.rol = rol;
    }

    if (contraseña) {
      const salt = await bcrypt.genSalt(10);
      usuario.contraseña = await bcrypt.hash(contraseña, salt);
      usuario.refresh_token = "REVOKED";
    }

    await usuario.save();

    return res.status(200).json({
      status: "success",
      mensaje: "Usuario actualizado exitosamente",
      data: {
        id_usuario: usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en updateUsuario:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "Error al actualizar el usuario",
    });
  }
};
