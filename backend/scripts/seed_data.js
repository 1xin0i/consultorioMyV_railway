/** @format */

import bcrypt from "bcryptjs";
import sequelize from "../config/database.js";
import {
  sincronizarModelos,
  Usuario,
  ObraSocial,
  EstadoTurno,
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
} from "../models/index.model.js";

async function cargarDatos() {
  console.log("==================================================");
  console.log("   INICIANDO CARGA DE DATOS DE PRUEBA (SEED)      ");
  console.log("==================================================");

  try {
    // 1. Sincronizar modelos y verificar estructura
    console.log("\n[1/10] Verificando tablas y sincronizando...");
    await sincronizarModelos();

    // 2. Obtener los IDs de los estados de turno existentes (el usuario ya los tiene)
    console.log("\n[2/10] Verificando estados de turno existentes...");
    const estados = await EstadoTurno.findAll();
    const estadoMap = {};
    estados.forEach((e) => {
      estadoMap[e.estado] = e.id_estado;
    });

    const idProgramado = estadoMap["Programado"] || 1;
    const idCancelado = estadoMap["Cancelado"] || 2;
    const idAtendido = estadoMap["Atendido"] || 3;
    const idInasistente = estadoMap["Inasistente"] || 4;

    console.log("   Estados detectados:", {
      Programado: idProgramado,
      Cancelado: idCancelado,
      Atendido: idAtendido,
      Inasistente: idInasistente,
    });

    // 3. Cargar Usuarios iniciales
    console.log("\n[3/10] Cargando usuarios...");
    const salt = await bcrypt.genSalt(10);
    const passAdmin = await bcrypt.hash("Admin123!", salt);
    const passOdonto = await bcrypt.hash("Odonto123!", salt);

    const usuariosData = [
      {
        nombre_usuario: "admin",
        contraseña: passAdmin,
        rol: "admin",
      },
      {
        nombre_usuario: "odontologo",
        contraseña: passOdonto,
        rol: "odontologo",
      },
      {
        nombre_usuario: "dra_valeria",
        contraseña: passOdonto,
        rol: "odontologo",
      },
    ];

    for (const u of usuariosData) {
      const existe = await Usuario.findOne({
        where: { nombre_usuario: u.nombre_usuario },
      });
      if (!existe) {
        await Usuario.create(u);
        console.log(`   + Usuario creado: ${u.nombre_usuario} (${u.rol})`);
      } else {
        console.log(`   = Usuario ya existente: ${u.nombre_usuario}`);
      }
    }

    // 4. Cargar Obras Sociales
    console.log("\n[4/10] Cargando obras sociales...");
    const obrasSocialesData = [
      { id_obra_social: 1, nombre: "Particular", activo: true },
      { id_obra_social: 2, nombre: "OSDE", activo: true },
      { id_obra_social: 3, nombre: "Swiss Medical", activo: true },
      { id_obra_social: 4, nombre: "Apross", activo: true },
      { id_obra_social: 5, nombre: "PAMI", activo: true },
      { id_obra_social: 6, nombre: "Galeno", activo: true },
      { id_obra_social: 7, nombre: "Medifé", activo: true },
      { id_obra_social: 8, nombre: "Sancor Salud", activo: true },
    ];

    const obrasSocialesCreadas = [];
    for (const os of obrasSocialesData) {
      const [registro] = await ObraSocial.findOrCreate({
        where: { nombre: os.nombre },
        defaults: os,
      });
      obrasSocialesCreadas.push(registro);
    }
    console.log(`   Total obras sociales listas: ${obrasSocialesCreadas.length}`);

    // 5. Cargar Categorías de Gasto
    console.log("\n[5/10] Cargando categorías de gasto...");
    const categoriasData = [
      {
        nombre: "Insumos Odontológicos",
        descripcion: "Resinas, guantes, anestesias, baberos, agujas y materiales clínicos",
      },
      {
        nombre: "Servicios Públicos",
        descripcion: "Luz, agua, gas, internet y telefonía fija del consultorio",
      },
      {
        nombre: "Alquiler y Expensas",
        descripcion: "Costo mensual de locación del inmueble y gastos comunes",
      },
      {
        nombre: "Laboratorio Dental",
        descripcion: "Fabricación de prótesis, coronas, pernos y modelos",
      },
      {
        nombre: "Mantenimiento y Equipamiento",
        descripcion: "Reparación de compresores, autoclave, instrumental rotatorio y sillón",
      },
      {
        nombre: "Limpieza y Desinfección",
        descripcion: "Detergentes enzimáticos, residuos patógenos y artículos de higiene",
      },
      {
        nombre: "Marketing y Publicidad",
        descripcion: "Gestión de redes sociales, diseño web y material gráfico",
      },
    ];

    const categoriasCreadas = {};
    for (const cat of categoriasData) {
      const [registro] = await CategoriaGasto.findOrCreate({
        where: { nombre: cat.nombre },
        defaults: cat,
      });
      categoriasCreadas[cat.nombre] = registro;
    }
    console.log(`   Total categorías de gasto listas: ${Object.keys(categoriasCreadas).length}`);

    // 6. Cargar Catálogo de Prácticas
    console.log("\n[6/10] Cargando prácticas odontológicas...");
    const practicasData = [
      {
        codigo_nomenclador: "01.01",
        nombre_nomenclador: "Consulta Odontológica General",
        nombre_referencia: "Examen bucal y diagnóstico inicial",
        especialidad: "Odontología General",
        precio_referencia: 15000.0,
      },
      {
        codigo_nomenclador: "01.04",
        nombre_nomenclador: "Consulta de Urgencia",
        nombre_referencia: "Atención por dolor agudo o traumatismo",
        especialidad: "Urgencias",
        precio_referencia: 20000.0,
      },
      {
        codigo_nomenclador: "02.01",
        nombre_nomenclador: "Limpieza y Tartrectomía",
        nombre_referencia: "Limpieza con ultrasonido y pulido",
        especialidad: "Periodoncia",
        precio_referencia: 25000.0,
      },
      {
        codigo_nomenclador: "02.02",
        nombre_nomenclador: "Tratamiento Periodontal por Sector",
        nombre_referencia: "Raspaje y alisado radicular",
        especialidad: "Periodoncia",
        precio_referencia: 38000.0,
      },
      {
        codigo_nomenclador: "03.01",
        nombre_nomenclador: "Restauración con Resina Simple",
        nombre_referencia: "Arreglo de caries simple 1 superficie",
        especialidad: "Operatoria Dental",
        precio_referencia: 28000.0,
      },
      {
        codigo_nomenclador: "03.02",
        nombre_nomenclador: "Restauración con Resina Compuesta",
        nombre_referencia: "Arreglo de caries compuesta 2 o más caras",
        especialidad: "Operatoria Dental",
        precio_referencia: 35000.0,
      },
      {
        codigo_nomenclador: "03.05",
        nombre_nomenclador: "Reconstrucción Estética de Ángulo",
        nombre_referencia: "Reconstrucción de pieza anterior fracturada",
        especialidad: "Operatoria Dental",
        precio_referencia: 42000.0,
      },
      {
        codigo_nomenclador: "05.01",
        nombre_nomenclador: "Extracción Simple",
        nombre_referencia: "Extracción dentaria unirradicular / multirradicular",
        especialidad: "Cirugía",
        precio_referencia: 30000.0,
      },
      {
        codigo_nomenclador: "05.02",
        nombre_nomenclador: "Extracción Quirúrgica / Tercer Molar",
        nombre_referencia: "Cirugía de muela de juicio retenida",
        especialidad: "Cirugía",
        precio_referencia: 60000.0,
      },
      {
        codigo_nomenclador: "07.01",
        nombre_nomenclador: "Radiografía Periapical",
        nombre_referencia: "Radiografía diagnóstica intraoral",
        especialidad: "Radiología",
        precio_referencia: 8000.0,
      },
      {
        codigo_nomenclador: "08.01",
        nombre_nomenclador: "Tratamiento de Conducto Unirradicular",
        nombre_referencia: "Endodoncia en diente anterior o premolar simple",
        especialidad: "Endodoncia",
        precio_referencia: 55000.0,
      },
      {
        codigo_nomenclador: "08.02",
        nombre_nomenclador: "Tratamiento de Conducto Multirradicular",
        nombre_referencia: "Endodoncia en molar",
        especialidad: "Endodoncia",
        precio_referencia: 75000.0,
      },
      {
        codigo_nomenclador: "10.01",
        nombre_nomenclador: "Corona de Porcelana sobre Zirconio / Metal",
        nombre_referencia: "Prótesis fija unitaria estética",
        especialidad: "Prótesis Fija",
        precio_referencia: 180000.0,
      },
      {
        codigo_nomenclador: "11.01",
        nombre_nomenclador: "Blanqueamiento Dental en Consultorio",
        nombre_referencia: "Aclaramiento dental ambulatorio/clínico",
        especialidad: "Estética Dental",
        precio_referencia: 95000.0,
      },
      {
        codigo_nomenclador: "13.01",
        nombre_nomenclador: "Placa Miorrelajante de Descanso",
        nombre_referencia: "Placa rígida termoestampada para bruxismo",
        especialidad: "Oclusión",
        precio_referencia: 65000.0,
      },
    ];

    const practicasCreadas = [];
    for (const p of practicasData) {
      const [registro] = await Practica.findOrCreate({
        where: { codigo_nomenclador: p.codigo_nomenclador },
        defaults: p,
      });
      practicasCreadas.push(registro);
    }
    console.log(`   Total prácticas odontológicas listas: ${practicasCreadas.length}`);

    // 7. Cargar Pacientes y su Cobertura Médica
    console.log("\n[7/10] Cargando pacientes...");
    const pacientesData = [
      {
        nombre: "Juan",
        apellido: "Pérez",
        dni: "38450123",
        fecha_nacimiento: "1995-04-12",
        telefono: "3514567890",
        domicilio: "Av. Colón 1234, Córdoba",
        obras_sociales: [{ id_os: 2, nro: "OSDE-987654321" }],
      },
      {
        nombre: "María",
        apellido: "González",
        dni: "40123987",
        fecha_nacimiento: "1997-09-25",
        telefono: "3516781234",
        domicilio: "Bv. San Juan 567, Córdoba",
        obras_sociales: [{ id_os: 3, nro: "SM-44556677" }],
      },
      {
        nombre: "Lucas",
        apellido: "Rodríguez",
        dni: "35678234",
        fecha_nacimiento: "1991-01-18",
        telefono: "3519876543",
        domicilio: "Chacabuco 890, Córdoba",
        obras_sociales: [{ id_os: 4, nro: "APR-11223344" }],
      },
      {
        nombre: "Lucía",
        apellido: "Martínez",
        dni: "42567890",
        fecha_nacimiento: "2000-06-30",
        telefono: "3513214567",
        domicilio: "Estrada 432, Córdoba",
        obras_sociales: [{ id_os: 1, nro: "PART-0004" }],
      },
      {
        nombre: "Carlos",
        apellido: "Benítez",
        dni: "31234567",
        fecha_nacimiento: "1985-11-05",
        telefono: "3518765432",
        domicilio: "Av. General Paz 789, Córdoba",
        obras_sociales: [{ id_os: 6, nro: "GAL-55667788" }],
      },
      {
        nombre: "Sofía",
        apellido: "Morales",
        dni: "44321987",
        fecha_nacimiento: "2002-03-14",
        telefono: "3512345678",
        domicilio: "Obispo Trejo 321, Córdoba",
        obras_sociales: [{ id_os: 7, nro: "MED-99881122" }],
      },
      {
        nombre: "Martín",
        apellido: "Gómez",
        dni: "28999888",
        fecha_nacimiento: "1982-08-20",
        telefono: "3515554321",
        domicilio: "Duarte Quirós 1450, Córdoba",
        obras_sociales: [{ id_os: 5, nro: "PAMI-00129845" }],
      },
      {
        nombre: "Valentina",
        apellido: "Rossi",
        dni: "39876543",
        fecha_nacimiento: "1996-12-03",
        telefono: "3517778899",
        domicilio: "San Lorenzo 250, Córdoba",
        obras_sociales: [{ id_os: 8, nro: "SS-77665544" }],
      },
    ];

    const pacientesCreados = [];
    for (const p of pacientesData) {
      let paciente = await Paciente.findOne({ where: { telefono: p.telefono } });
      if (!paciente && p.dni) {
        paciente = await Paciente.findOne({ where: { dni: p.dni } });
      }

      if (!paciente) {
        paciente = await Paciente.create({
          nombre: p.nombre,
          apellido: p.apellido,
          dni: p.dni,
          fecha_nacimiento: p.fecha_nacimiento,
          telefono: p.telefono,
          domicilio: p.domicilio,
          activo: true,
        });
        console.log(`   + Paciente registrado: ${p.nombre} ${p.apellido}`);
      }

      // Asociar obra social
      for (const os of p.obras_sociales) {
        const existeAsoc = await PacienteObraSocial.findOne({
          where: { id_paciente: paciente.id_paciente, id_obra_social: os.id_os },
        });
        if (!existeAsoc) {
          await PacienteObraSocial.create({
            id_paciente: paciente.id_paciente,
            id_obra_social: os.id_os,
            nro_afiliado: os.nro,
          });
        }
      }
      pacientesCreados.push(paciente);
    }
    console.log(`   Total pacientes listos: ${pacientesCreados.length}`);

    // 8. Cargar Turnos con Prácticas e Historial
    console.log("\n[8/10] Cargando turnos y atenciones...");
    const turnosData = [
      {
        id_paciente: pacientesCreados[0].id_paciente,
        id_estado: idAtendido,
        fecha_hora_inicio: "2026-11-05 09:00:00",
        fecha_hora_fin: "2026-11-05 09:45:00",
        precio_final: 15000.0,
        notas_consulta: "Primera consulta y diagnóstico. Se indica tartrectomía para próxima sesión.",
        practicas: [{ codigo: "01.01", id_os: 2 }],
        cobro: { monto: 15000.0, cuotas: 1, metodo: "Efectivo", pagado: true },
      },
      {
        id_paciente: pacientesCreados[1].id_paciente,
        id_estado: idAtendido,
        fecha_hora_inicio: "2026-11-06 10:00:00",
        fecha_hora_fin: "2026-11-06 11:00:00",
        precio_final: 35000.0,
        notas_consulta: "Restauración de resina en pieza 16 cara oclusal/distal.",
        practicas: [{ codigo: "03.02", id_os: 3 }],
        cobro: { monto: 35000.0, cuotas: 1, metodo: "Transferencia", pagado: true },
      },
      {
        id_paciente: pacientesCreados[2].id_paciente,
        id_estado: idAtendido,
        fecha_hora_inicio: "2026-11-07 14:00:00",
        fecha_hora_fin: "2026-11-07 15:15:00",
        precio_final: 75000.0,
        notas_consulta: "Tratamiento de conducto en molar 46. Procedimiento exitoso sin dolor residual.",
        practicas: [{ codigo: "08.02", id_os: 4 }],
        cobro: {
          monto: 75000.0,
          cuotas: 3,
          cuotas_detalle: [
            { nro: 1, monto: 25000.0, pagado: true, metodo: "Transferencia" },
            { nro: 2, monto: 25000.0, pagado: false, metodo: null },
            { nro: 3, monto: 25000.0, pagado: false, metodo: null },
          ],
        },
      },
      {
        id_paciente: pacientesCreados[3].id_paciente,
        id_estado: idCancelado,
        fecha_hora_inicio: "2026-11-08 16:00:00",
        fecha_hora_fin: "2026-11-08 16:40:00",
        precio_final: 0.0,
        notas_consulta: "El paciente canceló con 24hs de anticipación por motivos laborales.",
        practicas: [{ codigo: "02.01", id_os: 1 }],
      },
      {
        id_paciente: pacientesCreados[4].id_paciente,
        id_estado: idInasistente,
        fecha_hora_inicio: "2026-11-09 11:30:00",
        fecha_hora_fin: "2026-11-09 12:15:00",
        precio_final: 0.0,
        notas_consulta: "No se presentó ni respondió llamados de confirmación.",
        practicas: [{ codigo: "05.01", id_os: 6 }],
      },
      {
        id_paciente: pacientesCreados[5].id_paciente,
        id_estado: idProgramado,
        fecha_hora_inicio: "2026-11-12 09:30:00",
        fecha_hora_fin: "2026-11-12 10:15:00",
        precio_final: 25000.0,
        notas_consulta: "Control semestral y tartrectomía programada.",
        practicas: [{ codigo: "02.01", id_os: 7 }],
      },
      {
        id_paciente: pacientesCreados[6].id_paciente,
        id_estado: idProgramado,
        fecha_hora_inicio: "2026-11-12 11:00:00",
        fecha_hora_fin: "2026-11-12 12:00:00",
        precio_final: 60000.0,
        notas_consulta: "Extracción quirúrgica pieza 38 indicada por ortodoncista.",
        practicas: [{ codigo: "05.02", id_os: 5 }],
      },
      {
        id_paciente: pacientesCreados[7].id_paciente,
        id_estado: idProgramado,
        fecha_hora_inicio: "2026-11-13 15:00:00",
        fecha_hora_fin: "2026-11-13 16:00:00",
        precio_final: 95000.0,
        notas_consulta: "Sesión 1 de blanqueamiento dental ambulatorio/consultorio.",
        practicas: [{ codigo: "11.01", id_os: 8 }],
      },
    ];

    let turnosInsertados = 0;
    for (const t of turnosData) {
      // Verificar si ya existe un turno en ese horario con ese paciente
      let turno = await Turno.findOne({
        where: {
          id_paciente: t.id_paciente,
          fecha_hora_inicio: new Date(t.fecha_hora_inicio),
        },
      });

      if (!turno) {
        turno = await Turno.create({
          id_paciente: t.id_paciente,
          id_estado: t.id_estado,
          fecha_hora_inicio: t.fecha_hora_inicio,
          fecha_hora_fin: t.fecha_hora_fin,
          precio_final: t.precio_final,
          notas_consulta: t.notas_consulta,
          activo: true,
        });
        turnosInsertados++;

        // Registrar Historial de estado
        await HistorialEstadoTurno.create({
          id_turno: turno.id_turno,
          id_estado: t.id_estado,
          fecha_hora_cambio: t.fecha_hora_inicio,
          descripcion: `Estado inicial asignado: ${
            Object.keys(estadoMap).find((k) => estadoMap[k] === t.id_estado) || t.id_estado
          }`,
        });

        // Prácticas asociadas al turno
        for (const pr of t.practicas) {
          const practicaEncontrada = practicasCreadas.find(
            (p) => p.codigo_nomenclador === pr.codigo,
          );
          if (practicaEncontrada) {
            await PracticaTurno.create({
              id_turno: turno.id_turno,
              id_practica: practicaEncontrada.id_practica,
              id_obra_social: pr.id_os || null,
            });
          }
        }

        // Cobros asociados
        if (t.cobro && t.id_estado === idAtendido) {
          const cobro = await Cobro.create({
            id_turno: turno.id_turno,
            id_paciente: t.id_paciente,
            monto_a_cobrar: t.cobro.monto,
            cant_cuotas: t.cobro.cuotas,
            fecha_emision: t.fecha_hora_inicio.split(" ")[0],
            activo: true,
          });

          if (t.cobro.cuotas === 1) {
            await Cuota.create({
              id_cobro: cobro.id_cobro,
              nro_cuota: 1,
              monto_cuota: t.cobro.monto,
              monto_cobrado: t.cobro.pagado ? t.cobro.monto : 0,
              fecha_vencimiento: t.fecha_hora_inicio.split(" ")[0],
              fecha_cobro: t.cobro.pagado ? t.fecha_hora_inicio : null,
              metodo_pago: t.cobro.metodo || "Efectivo",
              estado: t.cobro.pagado ? "Pagada" : "Pendiente",
              activo: true,
            });
          } else if (t.cobro.cuotas_detalle) {
            let cuotaIndex = 1;
            for (const cd of t.cobro.cuotas_detalle) {
              const fechaVenc = new Date(t.fecha_hora_inicio);
              fechaVenc.setMonth(fechaVenc.getMonth() + (cuotaIndex - 1));

              await Cuota.create({
                id_cobro: cobro.id_cobro,
                nro_cuota: cd.nro,
                monto_cuota: cd.monto,
                monto_cobrado: cd.pagado ? cd.monto : 0,
                fecha_vencimiento: fechaVenc.toISOString().split("T")[0],
                fecha_cobro: cd.pagado ? t.fecha_hora_inicio : null,
                metodo_pago: cd.metodo || null,
                estado: cd.pagado ? "Pagada" : "Pendiente",
                activo: true,
              });
              cuotaIndex++;
            }
          }
        }
      }
    }
    console.log(`   Turnos creados/verificados: ${turnosData.length} (${turnosInsertados} nuevos)`);

    // 9. Cargar Gastos Operativos del Consultorio
    console.log("\n[9/10] Cargando gastos del consultorio...");
    const gastosData = [
      {
        categoria: "Alquiler y Expensas",
        monto: 180000.0,
        concepto: "Alquiler consultorio Noviembre 2026",
        fecha_gasto: "2026-11-01 10:00:00",
        metodo_pago: "Transferencia",
        comprobante: "REC-LOC-2026-11",
        notas: "Pago mensual de alquiler y expensas comunes",
      },
      {
        categoria: "Servicios Públicos",
        monto: 34500.0,
        concepto: "Factura EPEC - Energía Eléctrica",
        fecha_gasto: "2026-11-03 14:30:00",
        metodo_pago: "Transferencia",
        comprobante: "EPEC-9921448",
        notas: "Consumo bimestre consultorio",
      },
      {
        categoria: "Insumos Odontológicos",
        monto: 125000.0,
        concepto: "Compra de resinas Filtek Z250, carpules anestesia y guantes látex",
        fecha_gasto: "2026-11-04 11:20:00",
        metodo_pago: "Tarjeta",
        comprobante: "FACT-DENT-8832",
        notas: "Dental Córdoba - Pedido mensual de insumos básicos",
      },
      {
        categoria: "Laboratorio Dental",
        monto: 90000.0,
        concepto: "Corona de porcelana sobre zirconio p/ paciente Rodríguez",
        fecha_gasto: "2026-11-06 16:00:00",
        metodo_pago: "Transferencia",
        comprobante: "LAB-CERAM-541",
        notas: "Trabajo prótesis fija alta estética",
      },
      {
        categoria: "Mantenimiento y Equipamiento",
        monto: 45000.0,
        concepto: "Cambio de filtros y revisión compresor libre de aceite",
        fecha_gasto: "2026-11-08 09:15:00",
        metodo_pago: "Efectivo",
        comprobante: "SERV-TECH-109",
        notas: "Mantenimiento preventivo semestral",
      },
      {
        categoria: "Limpieza y Desinfección",
        monto: 22000.0,
        concepto: "Detergente enzimático y servicio recolección residuos patógenos",
        fecha_gasto: "2026-11-09 13:00:00",
        metodo_pago: "Efectivo",
        comprobante: "PATOG-0881",
        notas: "Retiro quincenal de bolsas rojas",
      },
    ];

    let gastosInsertados = 0;
    for (const g of gastosData) {
      const cat = categoriasCreadas[g.categoria];
      if (cat) {
        const existeGasto = await Gasto.findOne({
          where: {
            id_categoria_gasto: cat.id_categoria_gasto,
            comprobante: g.comprobante,
          },
        });

        if (!existeGasto) {
          await Gasto.create({
            id_categoria_gasto: cat.id_categoria_gasto,
            monto: g.monto,
            concepto: g.concepto,
            fecha_gasto: g.fecha_gasto,
            metodo_pago: g.metodo_pago,
            comprobante: g.comprobante,
            notas: g.notas,
            activo: true,
          });
          gastosInsertados++;
        }
      }
    }
    console.log(`   Gastos cargados: ${gastosInsertados} nuevos.`);

    // 10. Resumen final
    console.log("\n[10/10] Resumen de la base de datos:");
    console.log(`   - Usuarios:             ${await Usuario.count()}`);
    console.log(`   - Obras Sociales:       ${await ObraSocial.count()}`);
    console.log(`   - Categorías de Gasto:  ${await CategoriaGasto.count()}`);
    console.log(`   - Prácticas:            ${await Practica.count()}`);
    console.log(`   - Pacientes:            ${await Paciente.count()}`);
    console.log(`   - Turnos:               ${await Turno.count()}`);
    console.log(`   - Prácticas en Turnos:  ${await PracticaTurno.count()}`);
    console.log(`   - Cobros:               ${await Cobro.count()}`);
    console.log(`   - Cuotas:               ${await Cuota.count()}`);
    console.log(`   - Gastos:               ${await Gasto.count()}`);

    console.log("\n==================================================");
    console.log("   ¡CARGA DE DATOS COMPLETADA CON ÉXITO!          ");
    console.log("==================================================");
    console.log("\nCredenciales de acceso creadas:");
    console.log("   - Administrador: usuario 'admin' / contraseña 'Admin123!'");
    console.log("   - Odontólogo:   usuario 'odontologo' / contraseña 'Odonto123!'");
    console.log("   - Dra Valeria:  usuario 'dra_valeria' / contraseña 'Odonto123!'\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante la carga de datos:", error);
    process.exit(1);
  }
}

cargarDatos();

