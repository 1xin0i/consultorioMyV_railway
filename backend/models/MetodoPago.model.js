/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const MetodoPago = sequelize.define(
  "MetodoPago",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "metodos_pago",
    timestamps: false,
  },
);

export default MetodoPago;

