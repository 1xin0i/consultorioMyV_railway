/** @format */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar carga de variables de entorno desde backend/.env sin importar el cwd
dotenv.config({ path: path.join(__dirname, '../.env') });

import sequelize from '../config/database.js';
import {
  Usuario,
  EstadoTurno,
  ObraSocial,
  Paciente,
  PacienteObraSocial,
  Practica,
  Turno,
  PracticaTurno,
  HistorialEstadoTurno,
  Cobro,
  Cuota,
  CategoriaGasto,
  Gasto,
  sincronizarModelos,
} from '../models/index.model.js';

// Función auxiliar para fechas relativas (días hacia atrás o adelante respecto a hoy)
const getRelativeDate = (dayOffset, hours = 9, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// Formato YYYY-MM-DD para campos DATEONLY
const toDateOnly = (date) => {
  return date.toISOString().split('T')[0];
};

async function seed() {
  console.log('\n==================================================');
  console.log('🦷 INICIANDO SEEDER PARA CONSULTORIO ODONTOLÓGICO M&V');
  console.log('==================================================\n');

  try {
    await sequelize.authenticate();
    console.log('✔ Conexión a la base de datos verificada con éxito.');

    // Sincronizar modelos (crear tablas si no existen)
    await sincronizarModelos();

    console.log('\n🧹 Limpiando datos anteriores respetando relaciones...');
    // Desactivar temporalmente foreign keys para truncar limpiamente
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    const tablas = [
      'historial_estado_turno',
      'cuota',
      'cobro',
      'practica_turno',
      'turno',
      'paciente_obra_social',
      'paciente',
      'practica',
      'obra_social',
      'estado_turno',
      'gasto',
      'categoria_gasto',
      'usuario',
    ];

    for (const tabla of tablas) {
      await sequelize.query(`TRUNCATE TABLE \`${tabla}\`;`);
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✔ Tablas truncadas y preparadas.');

    // ==============================================================
    // 1. USUARIOS
    // ==============================================================
    console.log('\n👤 1. Creando usuarios con contraseñas encriptadas...');
    const salt = await bcrypt.genSalt(10);
    const passAdmin = await bcrypt.hash('Admin123!', salt);
    const passOdonto = await bcrypt.hash('Odonto123!', salt);
    const passRecepcion = await bcrypt.hash('Recepcion123!', salt);

    const usuarios = await Usuario.bulkCreate([
      {
        id_usuario: 1,
        nombre_usuario: 'admin',
        contraseña: passAdmin,
        rol: 'admin',
      },
      {
        id_usuario: 2,
        nombre_usuario: 'dra.valeria',
        contraseña: passOdonto,
        rol: 'odontologo',
      },
      {
        id_usuario: 3,
        nombre_usuario: 'dr.martin',
        contraseña: passOdonto,
        rol: 'odontologo',
      },
      {
        id_usuario: 4,
        nombre_usuario: 'recepcion',
        contraseña: passRecepcion,
        rol: 'admin',
      },
    ]);
    console.log(`✔ ${usuarios.length} usuarios creados.`);

    // ==============================================================
    // 2. ESTADOS DE TURNO
    // ==============================================================
    console.log('\n🏷️  2. Creando estados de turnos...');
    const estados = await EstadoTurno.bulkCreate([
      { id_estado: 1, estado: 'Programado' },
      { id_estado: 2, estado: 'Cancelado' },
      { id_estado: 3, estado: 'Atendido' },
      { id_estado: 4, estado: 'Inasistente' },
    ]);
    console.log(`✔ ${estados.length} estados de turno cargados.`);

    // ==============================================================
    // 3. OBRAS SOCIALES
    // ==============================================================
    console.log('\n🏥 3. Creando obras sociales y prepagas...');
    const obrasSociales = await ObraSocial.bulkCreate([
      { id_obra_social: 1, nombre: 'Particular', activo: true },
      { id_obra_social: 2, nombre: 'OSDE', activo: true },
      { id_obra_social: 3, nombre: 'Swiss Medical', activo: true },
      { id_obra_social: 4, nombre: 'Galeno', activo: true },
      { id_obra_social: 5, nombre: 'Medifé', activo: true },
      { id_obra_social: 6, nombre: 'Apross', activo: true },
      { id_obra_social: 7, nombre: 'PAMI', activo: true },
      { id_obra_social: 8, nombre: 'OMINT', activo: true },
      { id_obra_social: 9, nombre: 'Sancor Salud', activo: true },
      { id_obra_social: 10, nombre: 'Federada Salud', activo: true },
    ]);
    console.log(`✔ ${obrasSociales.length} obras sociales registradas.`);

    // ==============================================================
    // 4. PRÁCTICAS ODONTOLÓGICAS
    // ==============================================================
    console.log('\n🦷 4. Creando catálogo de prácticas odontológicas...');
    const practicas = await Practica.bulkCreate([
      {
        id_practica: 1,
        codigo_nomenclador: '01.01',
        nombre_nomenclador: 'Consulta Odontológica General y Diagnóstico',
        nombre_referencia: 'Consulta general y odontograma',
        especialidad: 'Odontología General',
        precio_referencia: 18000.0,
        activo: true,
      },
      {
        id_practica: 2,
        codigo_nomenclador: '02.01',
        nombre_nomenclador: 'Limpieza y Tartrectomía con Ultrasonido',
        nombre_referencia: 'Limpieza dental y profilaxis',
        especialidad: 'Periodoncia',
        precio_referencia: 30000.0,
        activo: true,
      },
      {
        id_practica: 3,
        codigo_nomenclador: '02.02',
        nombre_nomenclador: 'Topicación con Flúor y Selladores de Fosas',
        nombre_referencia: 'Prevención de caries en niños',
        especialidad: 'Odontopediatría',
        precio_referencia: 24000.0,
        activo: true,
      },
      {
        id_practica: 4,
        codigo_nomenclador: '03.01',
        nombre_nomenclador: 'Restauración Estética Simple con Composite',
        nombre_referencia: 'Arreglo de resina simple (caries leve)',
        especialidad: 'Operatoria Dental',
        precio_referencia: 36000.0,
        activo: true,
      },
      {
        id_practica: 5,
        codigo_nomenclador: '03.02',
        nombre_nomenclador: 'Restauración Estética Compleja con Composite',
        nombre_referencia: 'Reconstrucción dental con luz halógena',
        especialidad: 'Operatoria Dental',
        precio_referencia: 50000.0,
        activo: true,
      },
      {
        id_practica: 6,
        codigo_nomenclador: '04.01',
        nombre_nomenclador: 'Tratamiento de Conducto Unirradicular',
        nombre_referencia: 'Endodoncia simple pieza anterior',
        especialidad: 'Endodoncia',
        precio_referencia: 68000.0,
        activo: true,
      },
      {
        id_practica: 7,
        codigo_nomenclador: '04.02',
        nombre_nomenclador: 'Tratamiento de Conducto Multirradicular',
        nombre_referencia: 'Endodoncia molar con sellado radicular',
        especialidad: 'Endodoncia',
        precio_referencia: 92000.0,
        activo: true,
      },
      {
        id_practica: 8,
        codigo_nomenclador: '05.01',
        nombre_nomenclador: 'Extracción Dental Simple',
        nombre_referencia: 'Exodoncia común',
        especialidad: 'Cirugía Bucal',
        precio_referencia: 34000.0,
        activo: true,
      },
      {
        id_practica: 9,
        codigo_nomenclador: '05.02',
        nombre_nomenclador: 'Extracción Quirúrgica de Tercer Molar Retenido',
        nombre_referencia: 'Cirugía de muela de juicio compleja',
        especialidad: 'Cirugía Bucal',
        precio_referencia: 85000.0,
        activo: true,
      },
      {
        id_practica: 10,
        codigo_nomenclador: '06.01',
        nombre_nomenclador: 'Corona de Cerámica Pura sobre Zirconio',
        nombre_referencia: 'Funda / Corona estética dental',
        especialidad: 'Prótesis Dental',
        precio_referencia: 160000.0,
        activo: true,
      },
      {
        id_practica: 11,
        codigo_nomenclador: '06.02',
        nombre_nomenclador: 'Perno Muñón Colado de Precisión',
        nombre_referencia: 'Perno de anclaje para corona',
        especialidad: 'Prótesis Dental',
        precio_referencia: 58000.0,
        activo: true,
      },
      {
        id_practica: 12,
        codigo_nomenclador: '07.01',
        nombre_nomenclador: 'Instalación de Aparatología de Ortodoncia Fija',
        nombre_referencia: 'Colocación de brackets metálicos',
        especialidad: 'Ortodoncia',
        precio_referencia: 220000.0,
        activo: true,
      },
      {
        id_practica: 13,
        codigo_nomenclador: '07.02',
        nombre_nomenclador: 'Control y Activación Mensual de Ortodoncia',
        nombre_referencia: 'Ajuste mensual de brackets y arcos',
        especialidad: 'Ortodoncia',
        precio_referencia: 32000.0,
        activo: true,
      },
      {
        id_practica: 14,
        codigo_nomenclador: '08.01',
        nombre_nomenclador: 'Blanqueamiento Dental en Consultorio con Lámpara LED',
        nombre_referencia: 'Blanqueamiento estético con peróxido',
        especialidad: 'Estética Dental',
        precio_referencia: 110000.0,
        activo: true,
      },
      {
        id_practica: 15,
        codigo_nomenclador: '09.01',
        nombre_nomenclador: 'Urgencia Odontológica y Medicación Tópica',
        nombre_referencia: 'Atención de dolor agudo / pulpitis',
        especialidad: 'Urgencias',
        precio_referencia: 26000.0,
        activo: true,
      },
    ]);
    console.log(`✔ ${practicas.length} prácticas odontológicas creadas.`);

    // ==============================================================
    // 5. PACIENTES
    // ==============================================================
    console.log('\n🧑‍⚕️ 5. Registrando pacientes con datos reales de Córdoba...');
    const pacientes = await Paciente.bulkCreate([
      {
        id_paciente: 1,
        nombre: 'Juan Pablo',
        apellido: 'Pérez',
        dni: '38450123',
        fecha_nacimiento: '1995-04-12',
        telefono: '3514567890',
        domicilio: 'Av. Colón 1234, Barrio Alberdi, Córdoba',
        activo: true,
      },
      {
        id_paciente: 2,
        nombre: 'María Laura',
        apellido: 'González',
        dni: '40123987',
        fecha_nacimiento: '1997-09-25',
        telefono: '3516781234',
        domicilio: 'Bv. San Juan 567, Barrio Centro, Córdoba',
        activo: true,
      },
      {
        id_paciente: 3,
        nombre: 'Lucas David',
        apellido: 'Rodríguez',
        dni: '35678234',
        fecha_nacimiento: '1991-01-18',
        telefono: '3519876543',
        domicilio: 'Av. Chacabuco 890, Barrio Nueva Córdoba, Córdoba',
        activo: true,
      },
      {
        id_paciente: 4,
        nombre: 'Lucía Belén',
        apellido: 'Martínez',
        dni: '42567890',
        fecha_nacimiento: '2000-06-30',
        telefono: '3513214567',
        domicilio: 'José Manuel Estrada 432, Nueva Córdoba, Córdoba',
        activo: true,
      },
      {
        id_paciente: 5,
        nombre: 'Agustín',
        apellido: 'Fernández',
        dni: '33498112',
        fecha_nacimiento: '1988-11-04',
        telefono: '3517654321',
        domicilio: 'Fray Mamerto Esquiú 120, General Paz, Córdoba',
        activo: true,
      },
      {
        id_paciente: 6,
        nombre: 'Sofía',
        apellido: 'Benítez',
        dni: '44210985',
        fecha_nacimiento: '2002-03-14',
        telefono: '3512345678',
        domicilio: 'Av. Rafael Núñez 3890, Cerro de las Rosas, Córdoba',
        activo: true,
      },
      {
        id_paciente: 7,
        nombre: 'Facundo',
        apellido: 'Morales',
        dni: '36894012',
        fecha_nacimiento: '1992-08-22',
        telefono: '3518765432',
        domicilio: 'Rondeau 540, Nueva Córdoba, Córdoba',
        activo: true,
      },
      {
        id_paciente: 8,
        nombre: 'Camila',
        apellido: 'Rossi',
        dni: '41908761',
        fecha_nacimiento: '1999-12-05',
        telefono: '3515432189',
        domicilio: '27 de Abril 912, Centro, Córdoba',
        activo: true,
      },
      {
        id_paciente: 9,
        nombre: 'Mariano',
        apellido: 'Carrizo',
        dni: '29871234',
        fecha_nacimiento: '1983-05-19',
        telefono: '3514321987',
        domicilio: 'San Jerónimo 2150, San Vicente, Córdoba',
        activo: true,
      },
      {
        id_paciente: 10,
        nombre: 'Valentina',
        apellido: 'Díaz',
        dni: '46234891',
        fecha_nacimiento: '2005-02-10',
        telefono: '3516543290',
        domicilio: 'Luis de Tejeda 4100, Cerro de las Rosas, Córdoba',
        activo: true,
      },
      {
        id_paciente: 11,
        nombre: 'Carlos Alberto',
        apellido: 'Romero',
        dni: '18456123',
        fecha_nacimiento: '1967-07-28',
        telefono: '3519087123',
        domicilio: 'Av. Poeta Lugones 320, Nueva Córdoba, Córdoba',
        activo: true,
      },
      {
        id_paciente: 12,
        nombre: 'Florencia',
        apellido: 'Gutiérrez',
        dni: '39485721',
        fecha_nacimiento: '1996-10-15',
        telefono: '3518192031',
        domicilio: 'Obispo Trejo 780, Centro, Córdoba',
        activo: true,
      },
      {
        id_paciente: 13,
        nombre: 'Ignacio',
        apellido: 'Herrera',
        dni: '43901245',
        fecha_nacimiento: '2001-09-08',
        telefono: '3517263541',
        domicilio: 'Recta Martinoli 6800, Argüello, Córdoba',
        activo: true,
      },
      {
        id_paciente: 14,
        nombre: 'Martina',
        apellido: 'Castro',
        dni: '48123901',
        fecha_nacimiento: '2008-04-03',
        telefono: '3514981273',
        domicilio: 'Av. Emilio Caraffa 2100, Villa Cabrera, Córdoba',
        activo: true,
      },
      {
        id_paciente: 15,
        nombre: 'Guillermo',
        apellido: 'Silva',
        dni: '24891230',
        fecha_nacimiento: '1975-01-24',
        telefono: '3513847192',
        domicilio: 'Mariano Fragueiro 1400, Alta Córdoba, Córdoba',
        activo: true,
      },
    ]);
    console.log(`✔ ${pacientes.length} pacientes registrados.`);

    // ==============================================================
    // 6. AFILIACIÓN A OBRAS SOCIALES
    // ==============================================================
    console.log('\n📄 6. Asociando pacientes con obras sociales...');
    const pacienteObras = await PacienteObraSocial.bulkCreate([
      { id_paciente_obra_social: 1, id_paciente: 1, id_obra_social: 2, nro_afiliado: 'OSDE-210-4829104' },
      { id_paciente_obra_social: 2, id_paciente: 2, id_obra_social: 3, nro_afiliado: 'SM-50-8472910' },
      { id_paciente_obra_social: 3, id_paciente: 3, id_obra_social: 6, nro_afiliado: 'APR-55443322' },
      { id_paciente_obra_social: 4, id_paciente: 4, id_obra_social: 1, nro_afiliado: 'PARTICULAR' },
      { id_paciente_obra_social: 5, id_paciente: 5, id_obra_social: 4, nro_afiliado: 'GAL-ORO-904128' },
      { id_paciente_obra_social: 6, id_paciente: 6, id_obra_social: 3, nro_afiliado: 'SM-20-1928374' },
      { id_paciente_obra_social: 7, id_paciente: 7, id_obra_social: 2, nro_afiliado: 'OSDE-310-9948201' },
      { id_paciente_obra_social: 8, id_paciente: 8, id_obra_social: 5, nro_afiliado: 'MED-PLATA-38472' },
      { id_paciente_obra_social: 9, id_paciente: 9, id_obra_social: 6, nro_afiliado: 'APR-77889900' },
      { id_paciente_obra_social: 10, id_paciente: 10, id_obra_social: 8, nro_afiliado: 'OMINT-F40-1029' },
      { id_paciente_obra_social: 11, id_paciente: 11, id_obra_social: 7, nro_afiliado: 'PAMI-120938471' },
      { id_paciente_obra_social: 12, id_paciente: 12, id_obra_social: 9, nro_afiliado: 'SANCOR-500-482' },
      { id_paciente_obra_social: 13, id_paciente: 13, id_obra_social: 2, nro_afiliado: 'OSDE-210-776655' },
      { id_paciente_obra_social: 14, id_paciente: 14, id_obra_social: 6, nro_afiliado: 'APR-22334411' },
      { id_paciente_obra_social: 15, id_paciente: 15, id_obra_social: 10, nro_afiliado: 'FED-200-881920' },
    ]);
    console.log(`✔ ${pacienteObras.length} afiliaciones registradas.`);

    // ==============================================================
    // 7. CATEGORÍAS DE GASTO
    // ==============================================================
    console.log('\n📂 7. Creando categorías de gastos del consultorio...');
    const categoriasGasto = await CategoriaGasto.bulkCreate([
      {
        id_categoria_gasto: 1,
        nombre: 'Insumos y Materiales Dentales',
        descripcion: 'Resinas, composites, agujas, anestesia, guantes, baberos descartables',
        activo: true,
      },
      {
        id_categoria_gasto: 2,
        nombre: 'Laboratorio Dental',
        descripcion: 'Confección de coronas, incrustaciones, pernos y prótesis',
        activo: true,
      },
      {
        id_categoria_gasto: 3,
        nombre: 'Alquiler y Expensas',
        descripcion: 'Alquiler mensual del consultorio odontológico y expensas comunes',
        activo: true,
      },
      {
        id_categoria_gasto: 4,
        nombre: 'Servicios Públicos e Internet',
        descripcion: 'Facturas de electricidad (EPEC), agua (Aguas Cordobesas), gas e internet de alta velocidad',
        activo: true,
      },
      {
        id_categoria_gasto: 5,
        nombre: 'Mantenimiento de Equipamiento',
        descripcion: 'Service de sillones dentales, compresor de aire odontológico y autoclave',
        activo: true,
      },
      {
        id_categoria_gasto: 6,
        nombre: 'Sueldos y Honorarios',
        descripcion: 'Honorarios recepcionista, personal de asistencia dental y contaduría',
        activo: true,
      },
      {
        id_categoria_gasto: 7,
        nombre: 'Limpieza y Esterilización',
        descripcion: 'Detergentes enzimáticos, alcohol al 70%, bolsas de esterilizar y lavandina',
        activo: true,
      },
      {
        id_categoria_gasto: 8,
        nombre: 'Impuestos y Tasas',
        descripcion: 'Monotributo / IVA, Rentas Córdoba y tasa de comercio municipal',
        activo: true,
      },
    ]);
    console.log(`✔ ${categoriasGasto.length} categorías de gasto creadas.`);

    // ==============================================================
    // 8. GASTOS REALISTAS DEL MES Y MES PASADO
    // ==============================================================
    console.log('\n💸 8. Registrando gastos operativos del consultorio...');
    const gastos = await Gasto.bulkCreate([
      {
        id_categoria_gasto: 3,
        monto: 380000.0,
        concepto: 'Alquiler consultorio Av. Colón mes en curso',
        fecha_gasto: getRelativeDate(-10, 10, 0),
        metodo_pago: 'Transferencia',
        comprobante: 'REC-ALQ-2026-11',
        notas: 'Transferencia bancaria realizada al propietario',
        activo: true,
      },
      {
        id_categoria_gasto: 1,
        monto: 145000.0,
        concepto: 'Compra de 4 jeringas de resina 3M Filtek Z350 + adhesivo Single Bond',
        fecha_gasto: getRelativeDate(-8, 11, 30),
        metodo_pago: 'Tarjeta',
        comprobante: 'FAC-A-0004-00018920',
        notas: 'Dental Córdoba S.A. Pago en 1 cuota con tarjeta de crédito',
        activo: true,
      },
      {
        id_categoria_gasto: 2,
        monto: 98000.0,
        concepto: 'Laboratorio dental: 2 coronas de zirconio s/implante',
        fecha_gasto: getRelativeDate(-6, 16, 0),
        metodo_pago: 'Transferencia',
        comprobante: 'FAC-B-0002-00004512',
        notas: 'Laboratorio Dental Cerámico DentalArt',
        activo: true,
      },
      {
        id_categoria_gasto: 4,
        monto: 54000.0,
        concepto: 'Factura EPEC energía eléctrica consultorio',
        fecha_gasto: getRelativeDate(-5, 9, 15),
        metodo_pago: 'Transferencia',
        comprobante: 'DEB-EPEC-0921829',
        notas: 'Vencimiento pagado a tiempo',
        activo: true,
      },
      {
        id_categoria_gasto: 1,
        monto: 72000.0,
        concepto: 'Cajas de anestesia Carticaína 4% con epinefrina + agujas descartables',
        fecha_gasto: getRelativeDate(-3, 14, 0),
        metodo_pago: 'Efectivo',
        comprobante: 'TK-FISCAL-89210',
        notas: 'Compra en droguería dental de urgencia',
        activo: true,
      },
      {
        id_categoria_gasto: 7,
        monto: 28500.0,
        concepto: 'Insumos de esterilización: rollos de papel grado médico y detergente enzimático',
        fecha_gasto: getRelativeDate(-2, 10, 0),
        metodo_pago: 'Transferencia',
        comprobante: 'FAC-C-0001-00000891',
        notas: 'Farmacia y esterilización médica',
        activo: true,
      },
      {
        id_categoria_gasto: 5,
        monto: 65000.0,
        concepto: 'Service preventivo sillón dental principal y cambio de filtros compresor',
        fecha_gasto: getRelativeDate(-1, 15, 30),
        metodo_pago: 'Transferencia',
        comprobante: 'REC-SERV-10492',
        notas: 'Técnico Daniel Morales - Mantenimiento preventivo semestral',
        activo: true,
      },
      {
        id_categoria_gasto: 4,
        monto: 22000.0,
        concepto: 'Abono internet fibra óptica simétrica 300 megas',
        fecha_gasto: getRelativeDate(0, 8, 30),
        metodo_pago: 'Transferencia',
        comprobante: 'FAC-B-TELECOM-847291',
        notas: 'Fibertel / Telecom consultorio',
        activo: true,
      },
    ]);
    console.log(`✔ ${gastos.length} gastos operativos registrados.`);

    // ==============================================================
    // 9. TURNOS (Pasados, Hoy y Futuros para la Agenda)
    // ==============================================================
    console.log('\n📅 9. Generando turnos dinámicos en la agenda (pasados, hoy y futuros)...');
    
    // Turnos estructurados con fechas dinámicas
    const turnosData = [
      // --- TURNOS PASADOS (Atendidos, Cancelados, Inasistentes) ---
      {
        id_turno: 1,
        id_paciente: 1, // Juan Pablo Pérez
        id_estado: 3, // Atendido
        fecha_hora_inicio: getRelativeDate(-7, 9, 0),
        fecha_hora_fin: getRelativeDate(-7, 9, 45),
        precio_final: 30000.0,
        notas_consulta: 'Tartrectomía con ultrasonido completada en ambas arcadas. Paciente presenta leve gingivitis.',
        activo: true,
      },
      {
        id_turno: 2,
        id_paciente: 2, // María Laura González
        id_estado: 3, // Atendido
        fecha_hora_inicio: getRelativeDate(-5, 10, 30),
        fecha_hora_fin: getRelativeDate(-5, 11, 30),
        precio_final: 50000.0,
        notas_consulta: 'Restauración compuesta con resina fotocurable en pieza 2.4 por caries ocluso-mesial. Excelente oclusión.',
        activo: true,
      },
      {
        id_turno: 3,
        id_paciente: 3, // Lucas Rodríguez
        id_estado: 4, // Inasistente
        fecha_hora_inicio: getRelativeDate(-4, 15, 0),
        fecha_hora_fin: getRelativeDate(-4, 15, 30),
        precio_final: 0.0,
        notas_consulta: 'El paciente no se presentó ni dio aviso previo. Se reprogramará por WhatsApp.',
        activo: true,
      },
      {
        id_turno: 4,
        id_paciente: 4, // Lucía Martínez
        id_estado: 2, // Cancelado
        fecha_hora_inicio: getRelativeDate(-3, 16, 0),
        fecha_hora_fin: getRelativeDate(-3, 16, 40),
        precio_final: 0.0,
        notas_consulta: 'Canceló con 24 horas de anticipación por motivos laborales. Turno liberado.',
        activo: true,
      },
      {
        id_turno: 5,
        id_paciente: 5, // Agustín Fernández
        id_estado: 3, // Atendido
        fecha_hora_inicio: getRelativeDate(-2, 11, 0),
        fecha_hora_fin: getRelativeDate(-2, 12, 15),
        precio_final: 85000.0,
        notas_consulta: 'Cirugía de tercer molar retenido pieza 3.8. Sutura con seda 3-0. Se indica amoxicilina y ketorolac.',
        activo: true,
      },
      {
        id_turno: 6,
        id_paciente: 6, // Sofía Benítez
        id_estado: 3, // Atendido
        fecha_hora_inicio: getRelativeDate(-1, 14, 0),
        fecha_hora_fin: getRelativeDate(-1, 15, 0),
        precio_final: 92000.0,
        notas_consulta: 'Primera sesión de endodoncia molar pieza 4.6. Instrumentación rotatoria y conductometría con radiografía.',
        activo: true,
      },

      // --- TURNOS DE HOY ---
      {
        id_turno: 7,
        id_paciente: 7, // Facundo Morales
        id_estado: 3, // Atendido (Mañana temprano)
        fecha_hora_inicio: getRelativeDate(0, 9, 0),
        fecha_hora_fin: getRelativeDate(0, 9, 30),
        precio_final: 18000.0,
        notas_consulta: 'Consulta diagnóstica inicial. Se detectan lesiones cariosas incipientes en 1.5 y 1.6. Presupuesto entregado.',
        activo: true,
      },
      {
        id_turno: 8,
        id_paciente: 8, // Camila Rossi
        id_estado: 3, // Atendido
        fecha_hora_inicio: getRelativeDate(0, 10, 0),
        fecha_hora_fin: getRelativeDate(0, 10, 45),
        precio_final: 32000.0,
        notas_consulta: 'Control mensual de ortodoncia. Cambio de arcos Niti 0.16 superior e inferior. Ligaduras nuevas.',
        activo: true,
      },
      {
        id_turno: 9,
        id_paciente: 9, // Mariano Carrizo
        id_estado: 1, // Programado (Hoy a la tarde)
        fecha_hora_inicio: getRelativeDate(0, 15, 0),
        fecha_hora_fin: getRelativeDate(0, 16, 0),
        precio_final: 36000.0,
        notas_consulta: 'Restauración estética simple en incisivo central superior 1.1.',
        activo: true,
      },
      {
        id_turno: 10,
        id_paciente: 10, // Valentina Díaz
        id_estado: 1, // Programado (Hoy a última hora)
        fecha_hora_inicio: getRelativeDate(0, 17, 30),
        fecha_hora_fin: getRelativeDate(0, 18, 30),
        precio_final: 110000.0,
        notas_consulta: 'Sesión de blanqueamiento dental LED en consultorio.',
        activo: true,
      },

      // --- TURNOS FUTUROS (Próximos días) ---
      {
        id_turno: 11,
        id_paciente: 11, // Carlos Romero
        id_estado: 1, // Programado
        fecha_hora_inicio: getRelativeDate(1, 9, 30),
        fecha_hora_fin: getRelativeDate(1, 10, 30),
        precio_final: 160000.0,
        notas_consulta: 'Toma de impresión definitiva y prueba de cofia para corona de zirconio pieza 2.1.',
        activo: true,
      },
      {
        id_turno: 12,
        id_paciente: 12, // Florencia Gutiérrez
        id_estado: 1, // Programado
        fecha_hora_inicio: getRelativeDate(2, 11, 0),
        fecha_hora_fin: getRelativeDate(2, 11, 45),
        precio_final: 30000.0,
        notas_consulta: 'Limpieza de rutina y pulido coronario con pasta profiláctica.',
        activo: true,
      },
      {
        id_turno: 13,
        id_paciente: 13, // Ignacio Herrera
        id_estado: 1, // Programado
        fecha_hora_inicio: getRelativeDate(3, 14, 30),
        fecha_hora_fin: getRelativeDate(3, 15, 30),
        precio_final: 220000.0,
        notas_consulta: 'Instalación y cementado de aparatología fija brackets cerámicos superiores.',
        activo: true,
      },
      {
        id_turno: 14,
        id_paciente: 14, // Martina Castro
        id_estado: 1, // Programado
        fecha_hora_inicio: getRelativeDate(4, 16, 0),
        fecha_hora_fin: getRelativeDate(4, 16, 40),
        precio_final: 24000.0,
        notas_consulta: 'Odontopediatría: Control preventivo semestral y topicación de flúor barniz.',
        activo: true,
      },
      {
        id_turno: 15,
        id_paciente: 15, // Guillermo Silva
        id_estado: 1, // Programado
        fecha_hora_inicio: getRelativeDate(5, 10, 0),
        fecha_hora_fin: getRelativeDate(5, 10, 45),
        precio_final: 34000.0,
        notas_consulta: 'Extracción simple de raíz retenida pieza 4.5.',
        activo: true,
      },
    ];

    const turnos = await Turno.bulkCreate(turnosData);
    console.log(`✔ ${turnos.length} turnos generados en la agenda.`);

    // ==============================================================
    // 10. PRÁCTICA - TURNO
    // ==============================================================
    console.log('\n🔗 10. Asociando prácticas y obras sociales a cada turno...');
    const practicasTurnos = await PracticaTurno.bulkCreate([
      { id_practica_turno: 1, id_turno: 1, id_practica: 2, id_obra_social: 2 }, // Limpieza - OSDE
      { id_practica_turno: 2, id_turno: 2, id_practica: 5, id_obra_social: 3 }, // Rest. Compleja - Swiss Medical
      { id_practica_turno: 3, id_turno: 3, id_practica: 1, id_obra_social: 6 }, // Consulta - Apross
      { id_practica_turno: 4, id_turno: 4, id_practica: 4, id_obra_social: 1 }, // Rest. Simple - Particular
      { id_practica_turno: 5, id_turno: 5, id_practica: 9, id_obra_social: 4 }, // Cirugía Muela Juicio - Galeno
      { id_practica_turno: 6, id_turno: 6, id_practica: 7, id_obra_social: 3 }, // Endodoncia Molar - Swiss Medical
      { id_practica_turno: 7, id_turno: 7, id_practica: 1, id_obra_social: 2 }, // Consulta Inicial - OSDE
      { id_practica_turno: 8, id_turno: 8, id_practica: 13, id_obra_social: 5 }, // Control Ortodoncia - Medifé
      { id_practica_turno: 9, id_turno: 9, id_practica: 4, id_obra_social: 6 }, // Rest. Simple - Apross
      { id_practica_turno: 10, id_turno: 10, id_practica: 14, id_obra_social: 8 }, // Blanqueamiento LED - OMINT
      { id_practica_turno: 11, id_turno: 11, id_practica: 10, id_obra_social: 7 }, // Corona Zirconio - PAMI
      { id_practica_turno: 12, id_turno: 12, id_practica: 2, id_obra_social: 9 }, // Limpieza - Sancor Salud
      { id_practica_turno: 13, id_turno: 13, id_practica: 12, id_obra_social: 2 }, // Ortodoncia Fija - OSDE
      { id_practica_turno: 14, id_turno: 14, id_practica: 3, id_obra_social: 6 }, // Flúor Niños - Apross
      { id_practica_turno: 15, id_turno: 15, id_practica: 8, id_obra_social: 10 }, // Extracción - Federada Salud
    ]);
    console.log(`✔ ${practicasTurnos.length} relaciones práctica-turno registradas.`);

    // ==============================================================
    // 11. HISTORIAL DE ESTADOS DE TURNO
    // ==============================================================
    console.log('\n📜 11. Registrando historial y trazabilidad de turnos...');
    const historiales = await HistorialEstadoTurno.bulkCreate([
      { id_turno: 1, id_estado: 1, fecha_hora_cambio: getRelativeDate(-10, 10, 0), descripcion: 'Turno solicitado y programado' },
      { id_turno: 1, id_estado: 3, fecha_hora_cambio: getRelativeDate(-7, 9, 45), descripcion: 'Atención completada con éxito' },

      { id_turno: 2, id_estado: 1, fecha_hora_cambio: getRelativeDate(-8, 11, 0), descripcion: 'Turno programado por secretaria' },
      { id_turno: 2, id_estado: 3, fecha_hora_cambio: getRelativeDate(-5, 11, 30), descripcion: 'Atención completada' },

      { id_turno: 3, id_estado: 1, fecha_hora_cambio: getRelativeDate(-7, 14, 0), descripcion: 'Turno programado' },
      { id_turno: 3, id_estado: 4, fecha_hora_cambio: getRelativeDate(-4, 15, 30), descripcion: 'Paciente ausente sin aviso' },

      { id_turno: 4, id_estado: 1, fecha_hora_cambio: getRelativeDate(-6, 9, 0), descripcion: 'Turno programado' },
      { id_turno: 4, id_estado: 2, fecha_hora_cambio: getRelativeDate(-4, 16, 0), descripcion: 'Cancelado a pedido del paciente' },

      { id_turno: 5, id_estado: 1, fecha_hora_cambio: getRelativeDate(-5, 12, 0), descripcion: 'Turno programado' },
      { id_turno: 5, id_estado: 3, fecha_hora_cambio: getRelativeDate(-2, 12, 15), descripcion: 'Cirugía finalizada exitosamente' },

      { id_turno: 6, id_estado: 1, fecha_hora_cambio: getRelativeDate(-4, 15, 0), descripcion: 'Turno programado' },
      { id_turno: 6, id_estado: 3, fecha_hora_cambio: getRelativeDate(-1, 15, 0), descripcion: 'Sesión de conducto finalizada' },

      { id_turno: 7, id_estado: 1, fecha_hora_cambio: getRelativeDate(-2, 18, 0), descripcion: 'Turno agendado' },
      { id_turno: 7, id_estado: 3, fecha_hora_cambio: getRelativeDate(0, 9, 30), descripcion: 'Atendido en turno mañana de hoy' },

      { id_turno: 8, id_estado: 1, fecha_hora_cambio: getRelativeDate(-3, 11, 0), descripcion: 'Turno agendado' },
      { id_turno: 8, id_estado: 3, fecha_hora_cambio: getRelativeDate(0, 10, 45), descripcion: 'Control de brackets completado' },
    ]);
    console.log(`✔ ${historiales.length} registros de historial de turnos guardados.`);

    // ==============================================================
    // 12. COBROS Y CUOTAS (CAJA, INGRESOS Y FACTURACIÓN)
    // ==============================================================
    console.log('\n💰 12. Creando cobros y cuotas para el módulo de Caja...');
    
    // Cobro 1: Turno 1 (Juan Pérez, Limpieza $30.000, 1 pago en Efectivo)
    const cobro1 = await Cobro.create({
      id_cobro: 1,
      id_turno: 1,
      id_paciente: 1,
      monto_a_cobrar: 30000.0,
      cant_cuotas: 1,
      fecha_emision: getRelativeDate(-7, 9, 50),
      activo: true,
    });
    await Cuota.create({
      id_cuota: 1,
      id_cobro: cobro1.id_cobro,
      nro_cuota: 1,
      monto_cuota: 30000.0,
      monto_cobrado: 30000.0,
      fecha_vencimiento: toDateOnly(getRelativeDate(-7)),
      fecha_cobro: getRelativeDate(-7, 9, 50),
      metodo_pago: 'Efectivo',
      estado: 'Pagada',
      activo: true,
    });

    // Cobro 2: Turno 2 (María Laura González, Rest. Compleja $50.000, 2 cuotas)
    const cobro2 = await Cobro.create({
      id_cobro: 2,
      id_turno: 2,
      id_paciente: 2,
      monto_a_cobrar: 50000.0,
      cant_cuotas: 2,
      fecha_emision: getRelativeDate(-5, 11, 35),
      activo: true,
    });
    // Cuota 1 pagada
    await Cuota.create({
      id_cuota: 2,
      id_cobro: cobro2.id_cobro,
      nro_cuota: 1,
      monto_cuota: 25000.0,
      monto_cobrado: 25000.0,
      fecha_vencimiento: toDateOnly(getRelativeDate(-5)),
      fecha_cobro: getRelativeDate(-5, 11, 35),
      metodo_pago: 'Transferencia',
      estado: 'Pagada',
      activo: true,
    });
    // Cuota 2 pendiente (vence en 25 días)
    await Cuota.create({
      id_cuota: 3,
      id_cobro: cobro2.id_cobro,
      nro_cuota: 2,
      monto_cuota: 25000.0,
      monto_cobrado: null,
      fecha_vencimiento: toDateOnly(getRelativeDate(25)),
      fecha_cobro: null,
      metodo_pago: null,
      estado: 'Pendiente',
      activo: true,
    });

    // Cobro 3: Turno 5 (Agustín Fernández, Cirugía Muela $85.000, 1 pago Tarjeta)
    const cobro3 = await Cobro.create({
      id_cobro: 3,
      id_turno: 5,
      id_paciente: 5,
      monto_a_cobrar: 85000.0,
      cant_cuotas: 1,
      fecha_emision: getRelativeDate(-2, 12, 20),
      activo: true,
    });
    await Cuota.create({
      id_cuota: 4,
      id_cobro: cobro3.id_cobro,
      nro_cuota: 1,
      monto_cuota: 85000.0,
      monto_cobrado: 85000.0,
      fecha_vencimiento: toDateOnly(getRelativeDate(-2)),
      fecha_cobro: getRelativeDate(-2, 12, 20),
      metodo_pago: 'Tarjeta',
      estado: 'Pagada',
      activo: true,
    });

    // Cobro 4: Turno 6 (Sofía Benítez, Endodoncia $92.000, financiado en 3 cuotas)
    const cobro4 = await Cobro.create({
      id_cobro: 4,
      id_turno: 6,
      id_paciente: 6,
      monto_a_cobrar: 92000.0,
      cant_cuotas: 3,
      fecha_emision: getRelativeDate(-1, 15, 10),
      activo: true,
    });
    // Cuota 1 pagada
    await Cuota.create({
      id_cuota: 5,
      id_cobro: cobro4.id_cobro,
      nro_cuota: 1,
      monto_cuota: 32000.0,
      monto_cobrado: 32000.0,
      fecha_vencimiento: toDateOnly(getRelativeDate(-1)),
      fecha_cobro: getRelativeDate(-1, 15, 10),
      metodo_pago: 'Transferencia',
      estado: 'Pagada',
      activo: true,
    });
    // Cuota 2 pendiente (vence en 15 días)
    await Cuota.create({
      id_cuota: 6,
      id_cobro: cobro4.id_cobro,
      nro_cuota: 2,
      monto_cuota: 30000.0,
      monto_cobrado: null,
      fecha_vencimiento: toDateOnly(getRelativeDate(15)),
      fecha_cobro: null,
      metodo_pago: null,
      estado: 'Pendiente',
      activo: true,
    });
    // Cuota 3 pendiente (vence en 45 días)
    await Cuota.create({
      id_cuota: 7,
      id_cobro: cobro4.id_cobro,
      nro_cuota: 3,
      monto_cuota: 30000.0,
      monto_cobrado: null,
      fecha_vencimiento: toDateOnly(getRelativeDate(45)),
      fecha_cobro: null,
      metodo_pago: null,
      estado: 'Pendiente',
      activo: true,
    });

    // Cobro 5: Turno 7 (Facundo Morales, Consulta de Hoy $18.000, pagada en Efectivo)
    const cobro5 = await Cobro.create({
      id_cobro: 5,
      id_turno: 7,
      id_paciente: 7,
      monto_a_cobrar: 18000.0,
      cant_cuotas: 1,
      fecha_emision: getRelativeDate(0, 9, 35),
      activo: true,
    });
    await Cuota.create({
      id_cuota: 8,
      id_cobro: cobro5.id_cobro,
      nro_cuota: 1,
      monto_cuota: 18000.0,
      monto_cobrado: 18000.0,
      fecha_vencimiento: toDateOnly(getRelativeDate(0)),
      fecha_cobro: getRelativeDate(0, 9, 35),
      metodo_pago: 'Efectivo',
      estado: 'Pagada',
      activo: true,
    });

    // Cobro 6: Turno 8 (Camila Rossi, Control Ortodoncia de Hoy $32.000, pagada por Transferencia)
    const cobro6 = await Cobro.create({
      id_cobro: 6,
      id_turno: 8,
      id_paciente: 8,
      monto_a_cobrar: 32000.0,
      cant_cuotas: 1,
      fecha_emision: getRelativeDate(0, 10, 50),
      activo: true,
    });
    await Cuota.create({
      id_cuota: 9,
      id_cobro: cobro6.id_cobro,
      nro_cuota: 1,
      monto_cuota: 32000.0,
      monto_cobrado: 32000.0,
      fecha_vencimiento: toDateOnly(getRelativeDate(0)),
      fecha_cobro: getRelativeDate(0, 10, 50),
      metodo_pago: 'Transferencia',
      estado: 'Pagada',
      activo: true,
    });

    console.log(`✔ Cobros y Cuotas generados con éxito:`);
    console.log(`   - Cobros de contado (Efectivo, Tarjeta, Transferencia)`);
    console.log(`   - Cobros en cuotas con estados Pagadas y Pendientes`);

    console.log('\n==================================================');
    console.log('🎉 ¡SEED COMPLETADO EXITOSAMENTE!');
    console.log('==================================================');
    console.log('Resumen de credenciales de prueba disponibles:');
    console.log('👉 Admin:       usuario: admin        | clave: Admin123!');
    console.log('👉 Odontóloga:  usuario: dra.valeria  | clave: Odonto123!');
    console.log('👉 Odontólogo:  usuario: dr.martin    | clave: Odonto123!');
    console.log('👉 Recepción:   usuario: recepcion    | clave: Recepcion123!');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR AL EJECUTAR EL SEEDER:', error);
    process.exit(1);
  }
}

seed();
