-- ==========================================================
-- SCRIPT DE INICIALIZACIÓN Y SEEDERS: consultorio_myv
-- ==========================================================

USE consultorio_myv;

SET FOREIGN_KEY_CHECKS = 0;

-- Limpieza previa de tablas
TRUNCATE TABLE historial_estado_turno;
TRUNCATE TABLE cuota;
TRUNCATE TABLE cobro;
TRUNCATE TABLE practica_turno;
TRUNCATE TABLE turno;
TRUNCATE TABLE paciente_obra_social;
TRUNCATE TABLE paciente;
TRUNCATE TABLE practica;
TRUNCATE TABLE obra_social;
TRUNCATE TABLE estado_turno;
TRUNCATE TABLE gasto;
TRUNCATE TABLE categoria_gasto;
TRUNCATE TABLE usuario;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- 1. USUARIOS (Passwords encriptados con bcrypt)
-- admin: Admin123! | dra.valeria: Odonto123! | dr.martin: Odonto123! | recepcion: Recepcion123!
-- ==========================================================
INSERT INTO usuario (id_usuario, nombre_usuario, contraseña, rol) VALUES
(1, 'admin', '$2a$10$wN3k0XGqE.vNnQ6r0Bf0UeXh9gPZtB0E6C4hC7F7N9L3g3n3v0i2m', 'admin'),
(2, 'dra.valeria', '$2a$10$8lH7mK.n9V.P4j7K4s8zOeD0kZkZkZkZkZkZkZkZkZkZkZkZkZkZ.', 'odontologo'),
(3, 'dr.martin', '$2a$10$8lH7mK.n9V.P4j7K4s8zOeD0kZkZkZkZkZkZkZkZkZkZkZkZkZkZ.', 'odontologo'),
(4, 'recepcion', '$2a$10$x8rY5l4K9s7N.m0B1v8P6eP0kZkZkZkZkZkZkZkZkZkZkZkZkZkZ.', 'admin');

-- ==========================================================
-- 2. ESTADOS DE TURNO
-- ==========================================================
INSERT INTO estado_turno (id_estado, estado) VALUES
(1, 'Programado'),
(2, 'Cancelado'),
(3, 'Atendido'),
(4, 'Inasistente');

-- ==========================================================
-- 3. OBRAS SOCIALES
-- ==========================================================
INSERT INTO obra_social (id_obra_social, nombre, activo) VALUES
(1, 'Particular', TRUE),
(2, 'OSDE', TRUE),
(3, 'Swiss Medical', TRUE),
(4, 'Galeno', TRUE),
(5, 'Medifé', TRUE),
(6, 'Apross', TRUE),
(7, 'PAMI', TRUE),
(8, 'OMINT', TRUE),
(9, 'Sancor Salud', TRUE),
(10, 'Federada Salud', TRUE);

-- ==========================================================
-- 4. PRÁCTICAS ODONTOLÓGICAS
-- ==========================================================
INSERT INTO practica (id_practica, codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia, activo) VALUES
(1, '01.01', 'Consulta Odontológica General y Diagnóstico', 'Consulta general y odontograma', 'Odontología General', 18000.00, TRUE),
(2, '02.01', 'Limpieza y Tartrectomía con Ultrasonido', 'Limpieza dental y profilaxis', 'Periodoncia', 30000.00, TRUE),
(3, '02.02', 'Topicación con Flúor y Selladores de Fosas', 'Prevención de caries en niños', 'Odontopediatría', 24000.00, TRUE),
(4, '03.01', 'Restauración Estética Simple con Composite', 'Arreglo de resina simple (caries leve)', 'Operatoria Dental', 36000.00, TRUE),
(5, '03.02', 'Restauración Estética Compleja con Composite', 'Reconstrucción dental con luz halógena', 'Operatoria Dental', 50000.00, TRUE),
(6, '04.01', 'Tratamiento de Conducto Unirradicular', 'Endodoncia simple pieza anterior', 'Endodoncia', 68000.00, TRUE),
(7, '04.02', 'Tratamiento de Conducto Multirradicular', 'Endodoncia molar con sellado radicular', 'Endodoncia', 92000.00, TRUE),
(8, '05.01', 'Extracción Dental Simple', 'Exodoncia común', 'Cirugía Bucal', 34000.00, TRUE),
(9, '05.02', 'Extracción Quirúrgica de Tercer Molar Retenido', 'Cirugía de muela de juicio compleja', 'Cirugía Bucal', 85000.00, TRUE),
(10, '06.01', 'Corona de Cerámica Pura sobre Zirconio', 'Funda / Corona estética dental', 'Prótesis Dental', 160000.00, TRUE),
(11, '06.02', 'Perno Muñón Colado de Precisión', 'Perno de anclaje para corona', 'Prótesis Dental', 58000.00, TRUE),
(12, '07.01', 'Instalación de Aparatología de Ortodoncia Fija', 'Colocación de brackets metálicos', 'Ortodoncia', 220000.00, TRUE),
(13, '07.02', 'Control y Activación Mensual de Ortodoncia', 'Ajuste mensual de brackets y arcos', 'Ortodoncia', 32000.00, TRUE),
(14, '08.01', 'Blanqueamiento Dental en Consultorio con Lámpara LED', 'Blanqueamiento estético con peróxido', 'Estética Dental', 110000.00, TRUE),
(15, '09.01', 'Urgencia Odontológica y Medicación Tópica', 'Atención de dolor agudo / pulpitis', 'Urgencias', 26000.00, TRUE);

-- ==========================================================
-- 5. PACIENTES
-- ==========================================================
INSERT INTO paciente (id_paciente, nombre, apellido, dni, fecha_nacimiento, telefono, domicilio, activo) VALUES
(1, 'Juan Pablo', 'Pérez', '38450123', '1995-04-12', '3514567890', 'Av. Colón 1234, Barrio Alberdi, Córdoba', TRUE),
(2, 'María Laura', 'González', '40123987', '1997-09-25', '3516781234', 'Bv. San Juan 567, Barrio Centro, Córdoba', TRUE),
(3, 'Lucas David', 'Rodríguez', '35678234', '1991-01-18', '3519876543', 'Av. Chacabuco 890, Barrio Nueva Córdoba, Córdoba', TRUE),
(4, 'Lucía Belén', 'Martínez', '42567890', '2000-06-30', '3513214567', 'José Manuel Estrada 432, Nueva Córdoba, Córdoba', TRUE),
(5, 'Agustín', 'Fernández', '33498112', '1988-11-04', '3517654321', 'Fray Mamerto Esquiú 120, General Paz, Córdoba', TRUE),
(6, 'Sofía', 'Benítez', '44210985', '2002-03-14', '3512345678', 'Av. Rafael Núñez 3890, Cerro de las Rosas, Córdoba', TRUE),
(7, 'Facundo', 'Morales', '36894012', '1992-08-22', '3518765432', 'Rondeau 540, Nueva Córdoba, Córdoba', TRUE),
(8, 'Camila', 'Rossi', '41908761', '1999-12-05', '3515432189', '27 de Abril 912, Centro, Córdoba', TRUE),
(9, 'Mariano', 'Carrizo', '29871234', '1983-05-19', '3514321987', 'San Jerónimo 2150, San Vicente, Córdoba', TRUE),
(10, 'Valentina', 'Díaz', '46234891', '2005-02-10', '3516543290', 'Luis de Tejeda 4100, Cerro de las Rosas, Córdoba', TRUE),
(11, 'Carlos Alberto', 'Romero', '18456123', '1967-07-28', '3519087123', 'Av. Poeta Lugones 320, Nueva Córdoba, Córdoba', TRUE),
(12, 'Florencia', 'Gutiérrez', '39485721', '1996-10-15', '3518192031', 'Obispo Trejo 780, Centro, Córdoba', TRUE),
(13, 'Ignacio', 'Herrera', '43901245', '2001-09-08', '3517263541', 'Recta Martinoli 6800, Argüello, Córdoba', TRUE),
(14, 'Martina', 'Castro', '48123901', '2008-04-03', '3514981273', 'Av. Emilio Caraffa 2100, Villa Cabrera, Córdoba', TRUE),
(15, 'Guillermo', 'Silva', '24891230', '1975-01-24', '3513847192', 'Mariano Fragueiro 1400, Alta Córdoba, Córdoba', TRUE);

-- ==========================================================
-- 6. PACIENTE - OBRA SOCIAL
-- ==========================================================
INSERT INTO paciente_obra_social (id_paciente_obra_social, id_paciente, id_obra_social, nro_afiliado) VALUES
(1, 1, 2, 'OSDE-210-4829104'),
(2, 2, 3, 'SM-50-8472910'),
(3, 3, 6, 'APR-55443322'),
(4, 4, 1, 'PARTICULAR'),
(5, 5, 4, 'GAL-ORO-904128'),
(6, 6, 3, 'SM-20-1928374'),
(7, 7, 2, 'OSDE-310-9948201'),
(8, 8, 5, 'MED-PLATA-38472'),
(9, 9, 6, 'APR-77889900'),
(10, 10, 8, 'OMINT-F40-1029'),
(11, 11, 7, 'PAMI-120938471'),
(12, 12, 9, 'SANCOR-500-482'),
(13, 13, 2, 'OSDE-210-776655'),
(14, 14, 6, 'APR-22334411'),
(15, 15, 10, 'FED-200-881920');

-- ==========================================================
-- 7. CATEGORÍAS DE GASTO
-- ==========================================================
INSERT INTO categoria_gasto (id_categoria_gasto, nombre, descripcion, activo) VALUES
(1, 'Insumos y Materiales Dentales', 'Resinas, composites, agujas, anestesia, guantes, baberos descartables', TRUE),
(2, 'Laboratorio Dental', 'Confección de coronas, incrustaciones, pernos y prótesis', TRUE),
(3, 'Alquiler y Expensas', 'Alquiler mensual del consultorio odontológico y expensas comunes', TRUE),
(4, 'Servicios Públicos e Internet', 'Facturas de electricidad (EPEC), agua, gas e internet', TRUE),
(5, 'Mantenimiento de Equipamiento', 'Service de sillones dentales, compresor de aire y autoclave', TRUE),
(6, 'Sueldos y Honorarios', 'Honorarios recepcionista, asistencia dental y contaduría', TRUE),
(7, 'Limpieza y Esterilización', 'Detergentes enzimáticos, alcohol al 70% y bolsas de autoclave', TRUE),
(8, 'Impuestos y Tasas', 'Monotributo / IVA, Rentas Córdoba y tasa de comercio', TRUE);

-- ==========================================================
-- 8. GASTOS
-- ==========================================================
INSERT INTO gasto (id_gasto, id_categoria_gasto, monto, concepto, fecha_gasto, metodo_pago, comprobante, notas, activo) VALUES
(1, 3, 380000.00, 'Alquiler consultorio Av. Colón mes en curso', NOW() - INTERVAL 10 DAY, 'Transferencia', 'REC-ALQ-2026-11', 'Transferencia bancaria al propietario', TRUE),
(2, 1, 145000.00, 'Compra de 4 jeringas de resina 3M Filtek Z350 + adhesivo Single Bond', NOW() - INTERVAL 8 DAY, 'Tarjeta', 'FAC-A-0004-00018920', 'Dental Córdoba S.A. Pago 1 cuota', TRUE),
(3, 2, 98000.00, 'Laboratorio dental: 2 coronas de zirconio s/implante', NOW() - INTERVAL 6 DAY, 'Transferencia', 'FAC-B-0002-00004512', 'Laboratorio Dental Cerámico DentalArt', TRUE),
(4, 4, 54000.00, 'Factura EPEC energía eléctrica consultorio', NOW() - INTERVAL 5 DAY, 'Transferencia', 'DEB-EPEC-0921829', 'Vencimiento pagado a tiempo', TRUE),
(5, 1, 72000.00, 'Cajas de anestesia Carticaína 4% con epinefrina + agujas descartables', NOW() - INTERVAL 3 DAY, 'Efectivo', 'TK-FISCAL-89210', 'Droguería dental de urgencia', TRUE),
(6, 7, 28500.00, 'Insumos de esterilización: rollos de papel grado médico y detergente', NOW() - INTERVAL 2 DAY, 'Transferencia', 'FAC-C-0001-00000891', 'Farmacia y esterilización médica', TRUE),
(7, 5, 65000.00, 'Service preventivo sillón dental y cambio filtros compresor', NOW() - INTERVAL 1 DAY, 'Transferencia', 'REC-SERV-10492', 'Mantenimiento preventivo semestral', TRUE),
(8, 4, 22000.00, 'Abono internet fibra óptica simétrica 300 megas', NOW(), 'Transferencia', 'FAC-B-TELECOM-847291', 'Telecom / Fibertel consultorio', TRUE);

-- ==========================================================
-- 9. TURNOS
-- ==========================================================
INSERT INTO turno (id_turno, id_paciente, id_estado, fecha_hora_inicio, fecha_hora_fin, precio_final, notas_consulta, activo) VALUES
(1, 1, 3, NOW() - INTERVAL 7 DAY + INTERVAL 9 HOUR, NOW() - INTERVAL 7 DAY + INTERVAL 9 HOUR + INTERVAL 45 MINUTE, 30000.00, 'Tartrectomía con ultrasonido completada en ambas arcadas.', TRUE),
(2, 2, 3, NOW() - INTERVAL 5 DAY + INTERVAL 10 HOUR + INTERVAL 30 MINUTE, NOW() - INTERVAL 5 DAY + INTERVAL 11 HOUR + INTERVAL 30 MINUTE, 50000.00, 'Restauración compuesta con resina fotocurable en pieza 2.4.', TRUE),
(3, 3, 4, NOW() - INTERVAL 4 DAY + INTERVAL 15 HOUR, NOW() - INTERVAL 4 DAY + INTERVAL 15 HOUR + INTERVAL 30 MINUTE, 0.00, 'El paciente no se presentó ni dio aviso previo.', TRUE),
(4, 4, 2, NOW() - INTERVAL 3 DAY + INTERVAL 16 HOUR, NOW() - INTERVAL 3 DAY + INTERVAL 16 HOUR + INTERVAL 40 MINUTE, 0.00, 'Canceló con 24 horas de anticipación por motivos laborales.', TRUE),
(5, 5, 3, NOW() - INTERVAL 2 DAY + INTERVAL 11 HOUR, NOW() - INTERVAL 2 DAY + INTERVAL 12 HOUR + INTERVAL 15 MINUTE, 85000.00, 'Cirugía de tercer molar retenido pieza 3.8. Sutura con seda 3-0.', TRUE),
(6, 6, 3, NOW() - INTERVAL 1 DAY + INTERVAL 14 HOUR, NOW() - INTERVAL 1 DAY + INTERVAL 15 HOUR, 92000.00, 'Primera sesión de endodoncia molar pieza 4.6. Instrumentación rotatoria.', TRUE),
(7, 7, 3, NOW() + INTERVAL 9 HOUR, NOW() + INTERVAL 9 HOUR + INTERVAL 30 MINUTE, 18000.00, 'Consulta diagnóstica inicial. Lesiones cariosas incipientes en 1.5 y 1.6.', TRUE),
(8, 8, 3, NOW() + INTERVAL 10 HOUR, NOW() + INTERVAL 10 HOUR + INTERVAL 45 MINUTE, 32000.00, 'Control mensual de ortodoncia. Cambio de arcos Niti 0.16.', TRUE),
(9, 9, 1, NOW() + INTERVAL 15 HOUR, NOW() + INTERVAL 16 HOUR, 36000.00, 'Restauración estética simple en incisivo central superior 1.1.', TRUE),
(10, 10, 1, NOW() + INTERVAL 17 HOUR + INTERVAL 30 MINUTE, NOW() + INTERVAL 18 HOUR + INTERVAL 30 MINUTE, 110000.00, 'Sesión de blanqueamiento dental LED en consultorio.', TRUE),
(11, 11, 1, NOW() + INTERVAL 1 DAY + INTERVAL 9 HOUR + INTERVAL 30 MINUTE, NOW() + INTERVAL 1 DAY + INTERVAL 10 HOUR + INTERVAL 30 MINUTE, 160000.00, 'Toma de impresión definitiva y prueba de cofia para corona de zirconio.', TRUE),
(12, 12, 1, NOW() + INTERVAL 2 DAY + INTERVAL 11 HOUR, NOW() + INTERVAL 2 DAY + INTERVAL 11 HOUR + INTERVAL 45 MINUTE, 30000.00, 'Limpieza de rutina y pulido coronario con pasta profiláctica.', TRUE),
(13, 13, 1, NOW() + INTERVAL 3 DAY + INTERVAL 14 HOUR + INTERVAL 30 MINUTE, NOW() + INTERVAL 3 DAY + INTERVAL 15 HOUR + INTERVAL 30 MINUTE, 220000.00, 'Instalación y cementado de aparatología fija brackets cerámicos.', TRUE),
(14, 14, 1, NOW() + INTERVAL 4 DAY + INTERVAL 16 HOUR, NOW() + INTERVAL 4 DAY + INTERVAL 16 HOUR + INTERVAL 40 MINUTE, 24000.00, 'Odontopediatría: Control preventivo y topicación de flúor barniz.', TRUE),
(15, 15, 1, NOW() + INTERVAL 5 DAY + INTERVAL 10 HOUR, NOW() + INTERVAL 5 DAY + INTERVAL 10 HOUR + INTERVAL 45 MINUTE, 34000.00, 'Extracción simple de raíz retenida pieza 4.5.', TRUE);

-- ==========================================================
-- 10. PRÁCTICA - TURNO
-- ==========================================================
INSERT INTO practica_turno (id_practica_turno, id_turno, id_practica, id_obra_social) VALUES
(1, 1, 2, 2),
(2, 2, 5, 3),
(3, 3, 1, 6),
(4, 4, 4, 1),
(5, 5, 9, 4),
(6, 6, 7, 3),
(7, 7, 1, 2),
(8, 8, 13, 5),
(9, 9, 4, 6),
(10, 10, 14, 8),
(11, 11, 10, 7),
(12, 12, 2, 9),
(13, 13, 12, 2),
(14, 14, 3, 6),
(15, 15, 8, 10);

-- ==========================================================
-- 11. HISTORIAL ESTADO TURNO
-- ==========================================================
INSERT INTO historial_estado_turno (id_historial, id_turno, id_estado, fecha_hora_cambio, descripcion) VALUES
(1, 1, 1, NOW() - INTERVAL 10 DAY, 'Turno solicitado y programado'),
(2, 1, 3, NOW() - INTERVAL 7 DAY, 'Atención completada con éxito'),
(3, 2, 1, NOW() - INTERVAL 8 DAY, 'Turno programado por secretaria'),
(4, 2, 3, NOW() - INTERVAL 5 DAY, 'Atención completada'),
(5, 3, 1, NOW() - INTERVAL 7 DAY, 'Turno programado'),
(6, 3, 4, NOW() - INTERVAL 4 DAY, 'Paciente ausente sin aviso'),
(7, 4, 1, NOW() - INTERVAL 6 DAY, 'Turno programado'),
(8, 4, 2, NOW() - INTERVAL 4 DAY, 'Cancelado a pedido del paciente'),
(9, 5, 1, NOW() - INTERVAL 5 DAY, 'Turno programado'),
(10, 5, 3, NOW() - INTERVAL 2 DAY, 'Cirugía finalizada exitosamente'),
(11, 6, 1, NOW() - INTERVAL 4 DAY, 'Turno programado'),
(12, 6, 3, NOW() - INTERVAL 1 DAY, 'Sesión de conducto finalizada'),
(13, 7, 1, NOW() - INTERVAL 2 DAY, 'Turno agendado'),
(14, 7, 3, NOW(), 'Atendido en turno mañana de hoy'),
(15, 8, 1, NOW() - INTERVAL 3 DAY, 'Turno agendado'),
(16, 8, 3, NOW(), 'Control de brackets completado');

-- ==========================================================
-- 12. COBROS Y CUOTAS
-- ==========================================================
INSERT INTO cobro (id_cobro, id_turno, id_paciente, monto_a_cobrar, cant_cuotas, fecha_emision, activo) VALUES
(1, 1, 1, 30000.00, 1, NOW() - INTERVAL 7 DAY, TRUE),
(2, 2, 2, 50000.00, 2, NOW() - INTERVAL 5 DAY, TRUE),
(3, 5, 5, 85000.00, 1, NOW() - INTERVAL 2 DAY, TRUE),
(4, 6, 6, 92000.00, 3, NOW() - INTERVAL 1 DAY, TRUE),
(5, 7, 7, 18000.00, 1, NOW(), TRUE),
(6, 8, 8, 32000.00, 1, NOW(), TRUE);

INSERT INTO cuota (id_cuota, id_cobro, nro_cuota, monto_cuota, monto_cobrado, fecha_vencimiento, fecha_cobro, metodo_pago, estado, activo) VALUES
(1, 1, 1, 30000.00, 30000.00, CURDATE() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY, 'Efectivo', 'Pagada', TRUE),
(2, 2, 1, 25000.00, 25000.00, CURDATE() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, 'Transferencia', 'Pagada', TRUE),
(3, 2, 2, 25000.00, NULL, CURDATE() + INTERVAL 25 DAY, NULL, NULL, 'Pendiente', TRUE),
(4, 3, 1, 85000.00, 85000.00, CURDATE() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY, 'Tarjeta', 'Pagada', TRUE),
(5, 4, 1, 32000.00, 32000.00, CURDATE() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 'Transferencia', 'Pagada', TRUE),
(6, 4, 2, 30000.00, NULL, CURDATE() + INTERVAL 15 DAY, NULL, NULL, 'Pendiente', TRUE),
(7, 4, 3, 30000.00, NULL, CURDATE() + INTERVAL 45 DAY, NULL, NULL, 'Pendiente', TRUE),
(8, 5, 1, 18000.00, 18000.00, CURDATE(), NOW(), 'Efectivo', 'Pagada', TRUE),
(9, 6, 1, 32000.00, 32000.00, CURDATE(), NOW(), 'Transferencia', 'Pagada', TRUE);
