/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const RestriccionAgenda = sequelize.define(
  "RestriccionAgenda",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Bloqueado",
    },
    todo_el_dia: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "restricciones_agenda",
    timestamps: false,
  },
);
