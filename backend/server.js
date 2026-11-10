import 'dotenv/config';
import app from './index.js';
import sequelize from './config/database.js';
import { sincronizarModelos } from './models/index.model.js';

console.log("DEBUG DB:", {
     host: process.env.DB_HOST,
     port: process.env.DB_PORT,
     name: process.env.DB_NAME,
     user: process.env.DB_USER,
     dialect: process.env.DB_DIALECT,
   });

const PORT = process.env.PORT || 3000;

const bootstrap = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');

    await sincronizarModelos();

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar o sincronizar la base de datos:', error);
    process.exit(1);
  }
};

bootstrap();
