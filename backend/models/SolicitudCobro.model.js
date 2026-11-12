/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const SolicitudCobro = sequelize.define(
  "SolicitudCobro",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    turno_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    paciente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    monto_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "parcial", "saldado"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    observaciones: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "solicitudes_cobro",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default SolicitudCobro;

