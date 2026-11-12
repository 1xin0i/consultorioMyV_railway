-- ==========================================================
-- SCRIPT DE CARGA DE DATOS DE PRUEBA: consultorio_myv
-- NOTA: NO inserta en estado_turno porque ya existen.
-- ==========================================================

USE consultorio_myv;

-- 1. USUARIOS (Contraseñas con hash bcrypt)
-- admin: Admin123!
-- odontologo: Odonto123!
INSERT INTO usuario (id_usuario, nombre_usuario, contraseña, rol) VALUES
(1, 'admin', '$2a$10$v0k4bM6Rk7xT02o21u3uue9vFj3uKzM2GZ1e/46j1t4c2fXkC8Q5W', 'admin'),
(2, 'odontologo', '$2a$10$tZ2yP/8lqP8uE5oR7Z4tAOPc1bS3aL9xH2cM5k4n8o9p0q1r2s3t4', 'odontologo'),
(3, 'dra_valeria', '$2a$10$tZ2yP/8lqP8uE5oR7Z4tAOPc1bS3aL9xH2cM5k4n8o9p0q1r2s3t4', 'odontologo')
ON DUPLICATE KEY UPDATE nombre_usuario = VALUES(nombre_usuario);

-- 2. OBRAS SOCIALES
INSERT INTO obra_social (id_obra_social, nombre, codigo_prestador, activo) VALUES
(1, 'Particular', 'PART-00', TRUE),
(2, 'OSDE', 'OSDE-210', TRUE),
(3, 'Swiss Medical', 'SM-01', TRUE),
(4, 'Apross', 'APR-COR', TRUE),
(5, 'PAMI', 'PAMI-99', TRUE),
(6, 'Galeno', 'GAL-03', TRUE),
(7, 'Medifé', 'MED-05', TRUE),
(8, 'Sancor Salud', 'SS-02', TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), codigo_prestador = VALUES(codigo_prestador);

-- 3. CATEGORÍAS DE GASTO
INSERT INTO categoria_gasto (id_categoria_gasto, nombre, descripcion, activo) VALUES
(1, 'Insumos Odontológicos', 'Resinas, guantes, anestesias, baberos, agujas y materiales clínicos', TRUE),
(2, 'Servicios Públicos', 'Luz, agua, gas, internet y telefonía fija del consultorio', TRUE),
(3, 'Alquiler y Expensas', 'Costo mensual de locación del inmueble y gastos comunes', TRUE),
(4, 'Laboratorio Dental', 'Fabricación de prótesis, coronas, pernos y modelos', TRUE),
(5, 'Mantenimiento y Equipamiento', 'Reparación de compresores, autoclave, instrumental rotatorio y sillón', TRUE),
(6, 'Limpieza y Desinfección', 'Detergentes enzimáticos, residuos patógenos y artículos de higiene', TRUE),
(7, 'Marketing y Publicidad', 'Gestión de redes sociales, diseño web y material gráfico', TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- 4. PRÁCTICAS ODONTOLÓGICAS
INSERT INTO practica (id_practica, codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia, activo) VALUES
(1, '01.01', 'Consulta Odontológica General', 'Examen bucal y diagnóstico inicial', 'Odontología General', 15000.00, TRUE),
(2, '01.04', 'Consulta de Urgencia', 'Atención por dolor agudo o traumatismo', 'Urgencias', 20000.00, TRUE),
(3, '02.01', 'Limpieza y Tartrectomía', 'Limpieza con ultrasonido y pulido', 'Periodoncia', 25000.00, TRUE),
(4, '02.02', 'Tratamiento Periodontal por Sector', 'Raspaje y alisado radicular', 'Periodoncia', 38000.00, TRUE),
(5, '03.01', 'Restauración con Resina Simple', 'Arreglo de caries simple 1 superficie', 'Operatoria Dental', 28000.00, TRUE),
(6, '03.02', 'Restauración con Resina Compuesta', 'Arreglo de caries compuesta 2 o más caras', 'Operatoria Dental', 35000.00, TRUE),
(7, '03.05', 'Reconstrucción Estética de Ángulo', 'Reconstrucción de pieza anterior fracturada', 'Operatoria Dental', 42000.00, TRUE),
(8, '05.01', 'Extracción Simple', 'Extracción dentaria unirradicular / multirradicular', 'Cirugía', 30000.00, TRUE),
(9, '05.02', 'Extracción Quirúrgica / Tercer Molar', 'Cirugía de muela de juicio retenida', 'Cirugía', 60000.00, TRUE),
(10, '07.01', 'Radiografía Periapical', 'Radiografía diagnóstica intraoral', 'Radiología', 8000.00, TRUE),
(11, '08.01', 'Tratamiento de Conducto Unirradicular', 'Endodoncia en diente anterior o premolar simple', 'Endodoncia', 55000.00, TRUE),
(12, '08.02', 'Tratamiento de Conducto Multirradicular', 'Endodoncia en molar', 'Endodoncia', 75000.00, TRUE),
(13, '10.01', 'Corona de Porcelana sobre Zirconio / Metal', 'Prótesis fija unitaria estética', 'Prótesis Fija', 180000.00, TRUE),
(14, '11.01', 'Blanqueamiento Dental en Consultorio', 'Aclaramiento dental ambulatorio/clínico', 'Estética Dental', 95000.00, TRUE),
(15, '13.01', 'Placa Miorrelajante de Descanso', 'Placa rígida termoestampada para bruxismo', 'Oclusión', 65000.00, TRUE)
ON DUPLICATE KEY UPDATE nombre_nomenclador = VALUES(nombre_nomenclador), precio_referencia = VALUES(precio_referencia);

-- 5. PACIENTES
INSERT INTO paciente (id_paciente, nombre, apellido, dni, fecha_nacimiento, telefono, domicilio, activo) VALUES
(1, 'Juan', 'Pérez', '38450123', '1995-04-12', '3514567890', 'Av. Colón 1234, Córdoba', TRUE),
(2, 'María', 'González', '40123987', '1997-09-25', '3516781234', 'Bv. San Juan 567, Córdoba', TRUE),
(3, 'Lucas', 'Rodríguez', '35678234', '1991-01-18', '3519876543', 'Chacabuco 890, Córdoba', TRUE),
(4, 'Lucía', 'Martínez', '42567890', '2000-06-30', '3513214567', 'Estrada 432, Córdoba', TRUE),
(5, 'Carlos', 'Benítez', '31234567', '1985-11-05', '3518765432', 'Av. General Paz 789, Córdoba', TRUE),
(6, 'Sofía', 'Morales', '44321987', '2002-03-14', '3512345678', 'Obispo Trejo 321, Córdoba', TRUE),
(7, 'Martín', 'Gómez', '28999888', '1982-08-20', '3515554321', 'Duarte Quirós 1450, Córdoba', TRUE),
(8, 'Valentina', 'Rossi', '39876543', '1996-12-03', '3517778899', 'San Lorenzo 250, Córdoba', TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), apellido = VALUES(apellido);

-- 6. COBERTURA PACIENTE - OBRA SOCIAL
INSERT INTO paciente_obra_social (id_paciente, id_obra_social, nro_afiliado) VALUES
(1, 2, 'OSDE-987654321'),
(2, 3, 'SM-44556677'),
(3, 4, 'APR-11223344'),
(4, 1, 'PART-0004'),
(5, 6, 'GAL-55667788'),
(6, 7, 'MED-99881122'),
(7, 5, 'PAMI-00129845'),
(8, 8, 'SS-77665544')
ON DUPLICATE KEY UPDATE nro_afiliado = VALUES(nro_afiliado);

-- 7. TURNOS
-- 1: Programado, 2: Cancelado, 3: Atendido, 4: Inasistente
INSERT INTO turno (id_turno, id_paciente, id_estado, fecha_hora_inicio, fecha_hora_fin, precio_final, notas_consulta, activo) VALUES
(1, 1, 3, '2026-11-05 09:00:00', '2026-11-05 09:45:00', 15000.00, 'Primera consulta y diagnóstico. Se indica tartrectomía para próxima sesión.', TRUE),
(2, 2, 3, '2026-11-06 10:00:00', '2026-11-06 11:00:00', 35000.00, 'Restauración de resina en pieza 16 cara oclusal/distal.', TRUE),
(3, 3, 3, '2026-11-07 14:00:00', '2026-11-07 15:15:00', 75000.00, 'Tratamiento de conducto en molar 46. Procedimiento exitoso sin dolor residual.', TRUE),
(4, 4, 2, '2026-11-08 16:00:00', '2026-11-08 16:40:00', 0.00, 'El paciente canceló con 24hs de anticipación por motivos laborales.', TRUE),
(5, 5, 4, '2026-11-09 11:30:00', '2026-11-09 12:15:00', 0.00, 'No se presentó ni respondió llamados de confirmación.', TRUE),
(6, 6, 1, '2026-11-12 09:30:00', '2026-11-12 10:15:00', 25000.00, 'Control semestral y tartrectomía programada.', TRUE),
(7, 7, 1, '2026-11-12 11:00:00', '2026-11-12 12:00:00', 60000.00, 'Extracción quirúrgica pieza 38 indicada por ortodoncista.', TRUE),
(8, 8, 1, '2026-11-13 15:00:00', '2026-11-13 16:00:00', 95000.00, 'Sesión 1 de blanqueamiento dental ambulatorio/consultorio.', TRUE)
ON DUPLICATE KEY UPDATE notas_consulta = VALUES(notas_consulta);

-- 8. HISTORIAL DE ESTADOS DE TURNO
INSERT INTO historial_estado_turno (id_historial, id_turno, id_estado, fecha_hora_cambio, descripcion) VALUES
(1, 1, 3, '2026-11-05 09:45:00', 'Turno atendido y finalizado'),
(2, 2, 3, '2026-11-06 11:00:00', 'Turno atendido y finalizado'),
(3, 3, 3, '2026-11-07 15:15:00', 'Turno atendido y finalizado'),
(4, 4, 2, '2026-11-07 18:00:00', 'Cancelado con anticipación'),
(5, 5, 4, '2026-11-09 12:15:00', 'Marcado como inasistente'),
(6, 6, 1, '2026-11-10 10:00:00', 'Turno programado'),
(7, 7, 1, '2026-11-10 10:30:00', 'Turno programado'),
(8, 8, 1, '2026-11-10 11:00:00', 'Turno programado')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- 9. PRÁCTICAS ASOCIADAS A LOS TURNOS
INSERT INTO practica_turno (id_practica_turno, id_turno, id_practica, id_obra_social) VALUES
(1, 1, 1, 2),
(2, 2, 6, 3),
(3, 3, 12, 4),
(4, 4, 3, 1),
(5, 5, 8, 6),
(6, 6, 3, 7),
(7, 7, 9, 5),
(8, 8, 14, 8)
ON DUPLICATE KEY UPDATE id_practica = VALUES(id_practica);

-- 10. DETALLE DE DIENTES (FDI) Y CARAS
CREATE TABLE IF NOT EXISTS practica_turno_diente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_practica_turno INT NOT NULL,
  numero_fdi TINYINT NOT NULL,
  cara VARCHAR(10) NULL,
  FOREIGN KEY (id_practica_turno) REFERENCES practica_turno(id_practica_turno) ON DELETE CASCADE
);

INSERT INTO practica_turno_diente (id, id_practica_turno, numero_fdi, cara) VALUES
(1, 2, 16, 'OD'),
(2, 3, 46, NULL),
(3, 7, 38, NULL)
ON DUPLICATE KEY UPDATE cara = VALUES(cara);

-- 11. COBROS Y CUOTAS (asociados a turnos atendidos)
INSERT INTO cobro (id_cobro, id_turno, id_paciente, monto_a_cobrar, cant_cuotas, fecha_emision, activo) VALUES
(1, 1, 1, 15000.00, 1, '2026-11-05', TRUE),
(2, 2, 2, 35000.00, 1, '2026-11-06', TRUE),
(3, 3, 3, 75000.00, 3, '2026-11-07', TRUE)
ON DUPLICATE KEY UPDATE monto_a_cobrar = VALUES(monto_a_cobrar);

INSERT INTO cuota (id_cuota, id_cobro, nro_cuota, monto_cuota, monto_cobrado, fecha_vencimiento, fecha_cobro, metodo_pago, estado, activo) VALUES
(1, 1, 1, 15000.00, 15000.00, '2026-11-05', '2026-11-05 09:50:00', 'Efectivo', 'Pagada', TRUE),
(2, 2, 1, 35000.00, 35000.00, '2026-11-06', '2026-11-06 11:05:00', 'Transferencia', 'Pagada', TRUE),
(3, 3, 1, 25000.00, 25000.00, '2026-11-07', '2026-11-07 15:20:00', 'Transferencia', 'Pagada', TRUE),
(4, 3, 2, 25000.00, 0.00, '2026-12-07', NULL, NULL, 'Pendiente', TRUE),
(5, 3, 3, 25000.00, 0.00, '2027-01-07', NULL, NULL, 'Pendiente', TRUE)
ON DUPLICATE KEY UPDATE estado = VALUES(estado);

-- 12. GASTOS DEL CONSULTORIO
INSERT INTO gasto (id_gasto, id_categoria_gasto, monto, concepto, fecha_gasto, metodo_pago, comprobante, notas, activo) VALUES
(1, 3, 180000.00, 'Alquiler consultorio Noviembre 2026', '2026-11-01 10:00:00', 'Transferencia', 'REC-LOC-2026-11', 'Pago mensual de alquiler y expensas comunes', TRUE),
(2, 2, 34500.00, 'Factura EPEC - Energía Eléctrica', '2026-11-03 14:30:00', 'Transferencia', 'EPEC-9921448', 'Consumo bimestre consultorio', TRUE),
(3, 1, 125000.00, 'Compra de resinas Filtek Z250, carpules anestesia y guantes látex', '2026-11-04 11:20:00', 'Tarjeta', 'FACT-DENT-8832', 'Dental Córdoba - Pedido mensual de insumos básicos', TRUE),
(4, 4, 90000.00, 'Corona de porcelana sobre zirconio p/ paciente Rodríguez', '2026-11-06 16:00:00', 'Transferencia', 'LAB-CERAM-541', 'Trabajo prótesis fija alta estética', TRUE),
(5, 5, 45000.00, 'Cambio de filtros y revisión compresor libre de aceite', '2026-11-08 09:15:00', 'Efectivo', 'SERV-TECH-109', 'Mantenimiento preventivo semestral', TRUE),
(6, 6, 22000.00, 'Detergente enzimático y servicio recolección residuos patógenos', '2026-11-09 13:00:00', 'Efectivo', 'PATOG-0881', 'Retiro quincenal de bolsas rojas', TRUE)
ON DUPLICATE KEY UPDATE concepto = VALUES(concepto);

