/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { PracticaTurno } from "./PracticaTurno.model.js";

export const PracticaTurnoDiente = sequelize.define(
  "PracticaTurnoDiente",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_practica_turno: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PracticaTurno,
        key: "id_practica_turno",
      },
      onDelete: "CASCADE",
    },
    numero_fdi: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    cara: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
  },
  {
    tableName: "practica_turno_diente",
    timestamps: false,
    indexes: [
      {
        fields: ["id_practica_turno"],
      },
      {
        fields: ["numero_fdi"],
      },
    ],
  }
);

