/** @format */

import sequelize from "../config/database.js";

// Importar modelos
import { Paciente } from "./Paciente.model.js";
import { ObraSocial } from "./ObraSocial.model.js";
import { EstadoTurno } from "./EstadoTurno.model.js";
import { Turno } from "./Turno.model.js";
import { Practica } from "./Practica.model.js";
import { PracticaTurno } from "./PracticaTurno.model.js";
import { PacienteObraSocial } from "./PacienteObraSocial.model.js";
import { HistorialEstadoTurno } from "./HistorialEstadoTurno.model.js";
import { MetodoPago } from "./MetodoPago.model.js";
import { SolicitudCobro } from "./SolicitudCobro.model.js";
import { Cobro } from "./Cobro.model.js";
import { Usuario } from "./Usuario.model.js";
import { Gasto } from "./Gasto.model.js";
import { CategoriaGasto } from "./CategoriaGasto.model.js";
import { ConfiguracionAgenda } from "./ConfiguracionAgenda.model.js";
import { RestriccionAgenda } from "./RestriccionAgenda.model.js";

// Definir relaciones entre modelos
Paciente.hasMany(Turno, { foreignKey: "id_paciente" });
Turno.belongsTo(Paciente, { foreignKey: "id_paciente" });

EstadoTurno.hasMany(Turno, { foreignKey: "id_estado" });
Turno.belongsTo(EstadoTurno, { foreignKey: "id_estado" });

Practica.hasMany(PracticaTurno, { foreignKey: "id_practica" });
PracticaTurno.belongsTo(Practica, { foreignKey: "id_practica" });

Turno.hasMany(PracticaTurno, { foreignKey: "id_turno" });
PracticaTurno.belongsTo(Turno, { foreignKey: "id_turno" });

ObraSocial.hasMany(PracticaTurno, { foreignKey: "id_obra_social" });
PracticaTurno.belongsTo(ObraSocial, { foreignKey: "id_obra_social" });

Paciente.hasMany(PacienteObraSocial, { foreignKey: "id_paciente" });
PacienteObraSocial.belongsTo(Paciente, { foreignKey: "id_paciente" });

ObraSocial.hasMany(PacienteObraSocial, { foreignKey: "id_obra_social" });
PacienteObraSocial.belongsTo(ObraSocial, { foreignKey: "id_obra_social" });

// Configuración FK historial
Turno.hasMany(HistorialEstadoTurno, { foreignKey: "id_turno" });
HistorialEstadoTurno.belongsTo(Turno, { foreignKey: "id_turno" });

EstadoTurno.hasMany(HistorialEstadoTurno, { foreignKey: "id_estado" });
HistorialEstadoTurno.belongsTo(EstadoTurno, { foreignKey: "id_estado" });

// Solicitudes de cobro y cobros reales (criterio de lo percibido)
Turno.hasOne(SolicitudCobro, { foreignKey: "turno_id" });
SolicitudCobro.belongsTo(Turno, { foreignKey: "turno_id" });

Paciente.hasMany(SolicitudCobro, { foreignKey: "paciente_id" });
SolicitudCobro.belongsTo(Paciente, { foreignKey: "paciente_id" });

SolicitudCobro.hasMany(Cobro, {
  foreignKey: "solicitud_cobro_id",
  as: "Cobros",
});
Cobro.belongsTo(SolicitudCobro, {
  foreignKey: "solicitud_cobro_id",
  as: "SolicitudCobro",
});

MetodoPago.hasMany(Cobro, { foreignKey: "metodo_pago_id" });
Cobro.belongsTo(MetodoPago, {
  foreignKey: "metodo_pago_id",
  as: "MetodoPago",
});

CategoriaGasto.hasMany(Gasto, {
  foreignKey: "id_categoria_gasto",
  as: "Gastos",
});

Gasto.belongsTo(CategoriaGasto, {
  foreignKey: "id_categoria_gasto",
  as: "CategoriaGasto",
});

const sincronizarModelos = async () => {
  try {
    await sequelize.sync({ alter: false });

    // Limpieza de columnas obsoletas
    await sequelize
      .query(`ALTER TABLE obra_social DROP COLUMN codigo_prestador`)
      .catch(() => {});
    await sequelize
      .query(`ALTER TABLE gasto DROP COLUMN comprobante`)
      .catch(() => {});
    await sequelize
      .query(`ALTER TABLE gasto DROP COLUMN notas`)
      .catch(() => {});

    // Nuevas columnas en tabla usuario (email, recuperación por PIN y refresh_token)
    await sequelize
      .query(`ALTER TABLE usuario ADD COLUMN email VARCHAR(255) NULL UNIQUE`)
      .catch(() => {});
    await sequelize
      .query(`ALTER TABLE usuario ADD COLUMN reset_token VARCHAR(255) NULL`)
      .catch(() => {});
    await sequelize
      .query(`ALTER TABLE usuario ADD COLUMN reset_token_expires DATETIME NULL`)
      .catch(() => {});
    await sequelize
      .query(`ALTER TABLE usuario ADD COLUMN refresh_token VARCHAR(512) NULL`)
      .catch(() => {});

    // Nuevas columnas de configuración de ocupación en agenda
    await sequelize
      .query(
        `ALTER TABLE configuracion_agenda ADD COLUMN ocupacion_baja_max INT NOT NULL DEFAULT 50`,
      )
      .catch(() => {});
    await sequelize
      .query(
        `ALTER TABLE configuracion_agenda ADD COLUMN ocupacion_media_max INT NOT NULL DEFAULT 80`,
      )
      .catch(() => {});

    // 1. Seed de métodos de pago base
    try {
      const metodosBase = [
        { id: 1, nombre: "Efectivo" },
        { id: 2, nombre: "Transferencia" },
        { id: 3, nombre: "Tarjeta" },
        { id: 4, nombre: "Otro" },
      ];
      for (const m of metodosBase) {
        await MetodoPago.findOrCreate({
          where: { id: m.id },
          defaults: m,
        });
      }
    } catch {
      // Silencioso en caso de sincronizaciones tempranas
    }

    // 2. Migración automática desde tablas legacy (cobro / cuota) hacia solicitudes_cobro y cobros
    try {
      const cantSolicitudes = await SolicitudCobro.count();
      if (cantSolicitudes === 0) {
        const [cobrosLegacy] = await sequelize.query(
          `SELECT id_cobro, id_turno, id_paciente, monto_a_cobrar, fecha_emision FROM cobro WHERE activo = 1`,
        );

        if (Array.isArray(cobrosLegacy) && cobrosLegacy.length > 0) {
          const mapaMetodoId = {
            efectivo: 1,
            transferencia: 2,
            tarjeta: 3,
            otro: 4,
          };

          for (const leg of cobrosLegacy) {
            const [cuotasLegacy] = await sequelize
              .query(
                `SELECT monto_cobrado, fecha_cobro, metodo_pago FROM cuota WHERE id_cobro = :idCobro AND activo = 1`,
                { replacements: { idCobro: leg.id_cobro } },
              )
              .catch(() => [[]]);

            const pagosRealizados = (cuotasLegacy || []).filter(
              (q) => Number(q.monto_cobrado) > 0,
            );
            const sumaPagado = pagosRealizados.reduce(
              (acc, q) => acc + (Number(q.monto_cobrado) || 0),
              0,
            );
            const montoTotal = Number(leg.monto_a_cobrar) || 0;

            let estadoSolicitud = "pendiente";
            if (sumaPagado >= montoTotal - 0.009 && montoTotal > 0) {
              estadoSolicitud = "saldado";
            } else if (sumaPagado > 0) {
              estadoSolicitud = "parcial";
            }

            const nuevaSolicitud = await SolicitudCobro.create({
              turno_id: leg.id_turno || null,
              paciente_id: leg.id_paciente,
              monto_total: montoTotal,
              estado: estadoSolicitud,
              observaciones: null,
              created_at: leg.fecha_emision || new Date(),
              updated_at: leg.fecha_emision || new Date(),
            });

            for (const pago of pagosRealizados) {
              const metodoKey = String(pago.metodo_pago || "efectivo")
                .trim()
                .toLowerCase();
              const metodoId = mapaMetodoId[metodoKey] || 1;
              await Cobro.create({
                solicitud_cobro_id: nuevaSolicitud.id,
                monto: Number(pago.monto_cobrado),
                metodo_pago_id: metodoId,
                fecha_cobro:
                  pago.fecha_cobro || leg.fecha_emision || new Date(),
                observaciones:
                  estadoSolicitud === "saldado"
                    ? "Pago registrado"
                    : "Entrega parcial",
                created_at:
                  pago.fecha_cobro || leg.fecha_emision || new Date(),
              });
            }
          }
        }
      }
      // Eliminar tablas legacy cuota y cobro si aún existen
      await sequelize.query(`DROP TABLE IF EXISTS cuota`).catch(() => {});
      await sequelize.query(`DROP TABLE IF EXISTS cobro`).catch(() => {});
    } catch {
      // Silencioso si las tablas legacy ya no existen
    }

    // 3. Asegurar fila única por defecto en configuracion_agenda (id = 1)
    try {
      await ConfiguracionAgenda.findOrCreate({
        where: { id: 1 },
        defaults: {
          id: 1,
          hora_inicio: "08:00:00",
          hora_fin: "20:00:00",
          duracion_modulo_minutos: 30,
          dias_laborales: [1, 2, 3, 4, 5, 6],
          ocupacion_baja_max: 50,
          ocupacion_media_max: 80,
        },
      });
    } catch {
      // Silencioso en caso de sincronizaciones tempranas
    }

    console.log("Base de datos sincronizada correctamente");
    return true;
  } catch (error) {
    console.error("Error al sincronizar la base de datos:", error);
    return false;
  }
};

export {
  Paciente,
  ObraSocial,
  EstadoTurno,
  Turno,
  Practica,
  PracticaTurno,
  PacienteObraSocial,
  HistorialEstadoTurno,
  MetodoPago,
  SolicitudCobro,
  Cobro,
  Usuario,
  Gasto,
  CategoriaGasto,
  ConfiguracionAgenda,
  RestriccionAgenda,
  sincronizarModelos,
};
