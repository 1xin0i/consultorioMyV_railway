/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const ConfiguracionAgenda = sequelize.define(
  "ConfiguracionAgenda",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: "08:00:00",
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: "20:00:00",
    },
    duracion_modulo_minutos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    dias_laborales: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [1, 2, 3, 4, 5, 6],
      get() {
        const raw = this.getDataValue("dias_laborales");
        if (Array.isArray(raw)) return raw.map(Number);
        if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(Number) : [1, 2, 3, 4, 5, 6];
          } catch {
            return [1, 2, 3, 4, 5, 6];
          }
        }
        return [1, 2, 3, 4, 5, 6];
      },
    },
    ocupacion_baja_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
    },
    ocupacion_media_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 80,
    },
  },
  {
    tableName: "configuracion_agenda",
    timestamps: false,
  },
);
