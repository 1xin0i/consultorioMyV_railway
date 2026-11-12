/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Usuario = sequelize.define(
  "Usuario",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_usuario: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    contraseña: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: {
          msg: "Formato de correo electrónico inválido.",
        },
      },
    },
    reset_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    rol: {
      type: DataTypes.ENUM("admin", "odontologo"),
      allowNull: false,
      defaultValue: "odontologo",
      validate: {
        isIn: {
          args: [["admin", "odontologo"]],
          msg: "El rol no es un valor permitido dentro del ENUM.",
        },
      },
    },
  },
  {
    tableName: "usuario",
    timestamps: false,
  },
);

export default Usuario;
