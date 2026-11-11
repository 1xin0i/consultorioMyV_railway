/** @format */

import sequelize from "../config/database.js";

// Importar modelos
import { Paciente } from "./Paciente.model.js";
import { ObraSocial } from "./ObraSocial.model.js";
import { EstadoTurno } from "./EstadoTurno.model.js";
import { Turno } from "./Turno.model.js";
import { Practica } from "./Practica.model.js";
import { PracticaTurno } from "./PracticaTurno.model.js";
import { PracticaTurnoDiente } from "./PracticaTurnoDiente.model.js";
import { PacienteObraSocial } from "./PacienteObraSocial.model.js";
import { HistorialEstadoTurno } from "./HistorialEstadoTurno.model.js";
import { Cobro } from "./Cobro.model.js";
import { Cuota } from "./Cuota.model.js";
import { Usuario } from "./Usuario.model.js";
import { Gasto } from "./Gasto.model.js";
import { CategoriaGasto } from "./CategoriaGasto.model.js";

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

PracticaTurno.hasMany(PracticaTurnoDiente, {
  foreignKey: "id_practica_turno",
  as: "dientes",
  onDelete: "CASCADE",
});
PracticaTurnoDiente.belongsTo(PracticaTurno, {
  foreignKey: "id_practica_turno",
  as: "practicaTurno",
});

Paciente.hasMany(PacienteObraSocial, { foreignKey: "id_paciente" });
PacienteObraSocial.belongsTo(Paciente, { foreignKey: "id_paciente" });

ObraSocial.hasMany(PacienteObraSocial, { foreignKey: "id_obra_social" });
PacienteObraSocial.belongsTo(ObraSocial, { foreignKey: "id_obra_social" });

//configuracion FK historial
Turno.hasMany(HistorialEstadoTurno, { foreignKey: "id_turno" });
HistorialEstadoTurno.belongsTo(Turno, { foreignKey: "id_turno" });

EstadoTurno.hasMany(HistorialEstadoTurno, { foreignKey: "id_estado" });
HistorialEstadoTurno.belongsTo(EstadoTurno, { foreignKey: "id_estado" });

Turno.hasOne(Cobro, { foreignKey: "id_turno" });
Cobro.belongsTo(Turno, { foreignKey: "id_turno" });

Paciente.hasMany(Cobro, { foreignKey: "id_paciente" });
Cobro.belongsTo(Paciente, { foreignKey: "id_paciente" });

Cobro.hasMany(Cuota, { foreignKey: "id_cobro" });
Cuota.belongsTo(Cobro, { foreignKey: "id_cobro" });

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
    await sequelize.sync({ alter: false }); // Poner en true para sincronizar los modelos con la base de datos (crear tablas si no existen)
    await sequelize
      .query(
        `CREATE TABLE IF NOT EXISTS practica_turno_diente (
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_practica_turno INT NOT NULL,
          numero_fdi TINYINT NOT NULL,
          cara VARCHAR(10) NULL,
          FOREIGN KEY (id_practica_turno) REFERENCES practica_turno(id_practica_turno) ON DELETE CASCADE
        )`
      )
      .catch(() => {});

    await sequelize
      .query(
        `ALTER TABLE obra_social ADD COLUMN codigo_prestador VARCHAR(50) NULL DEFAULT NULL`
      )
      .catch(() => {});

    // Reparación de seguridad para cobros que hayan quedado sin cuotas asociadas
    try {
      const cobrosSinCuota = await Cobro.findAll({
        where: { activo: true },
        include: [{ model: Cuota, attributes: ["id_cuota"] }],
      });
      const pendientesReparar = cobrosSinCuota.filter(
        (c) => !c.Cuotas || c.Cuotas.length === 0
      );
      if (pendientesReparar.length > 0) {
        const hoy = new Date().toISOString().split("T")[0];
        for (const c of pendientesReparar) {
          await Cuota.create({
            id_cobro: c.id_cobro,
            nro_cuota: 1,
            monto_cuota: Number(c.monto_a_cobrar) || 0,
            monto_cobrado: 0,
            fecha_vencimiento: hoy,
            fecha_cobro: null,
            metodo_pago: "Efectivo",
            estado: "Pendiente",
          });
        }
      }
    } catch {
      // Silencioso en caso de pruebas o sincronizaciones tempranas
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
  PracticaTurnoDiente,
  PacienteObraSocial,
  HistorialEstadoTurno,
  Cobro,
  Cuota,
  Usuario,
  Gasto,
  CategoriaGasto,
  sincronizarModelos,
};
