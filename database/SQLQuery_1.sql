BEGIN TRANSACTION;

-- Insertar pago
INSERT INTO PAGO_CITA (
  pago_cantidadTotal, 
  pago_abonado, 
  pago_fechahora, 
  estatuspago
) VALUES (
  800.00, -- costo
  0.00,   -- abonado
  GETDATE(),
  0       -- pendiente
);

-- Obtener ID del pago
DECLARE @id_pago INT = SCOPE_IDENTITY();

-- Insertar cita
INSERT INTO CITA (
  fk_cita_CURP, 
  fk_cedula, 
  fk_id_citaEstatus, 
  id_pago, 
  cita_fechahora
) VALUES (
  'PEGJ900515HDFRZN01', -- CURP de ejemplo
  'CED987654321',       -- cédula médico
  1,                    -- estatus pendiente
  @id_pago,
  '2025-06-29 10:00:00' -- fecha y hora
);

-- Ver resultados
SELECT * FROM PAGO_CITA WHERE id_pago = @id_pago;
SELECT * FROM CITA WHERE id_pago = @id_pago;

-- Si todo está bien
COMMIT TRANSACTION;
-- Si hay errores
-- ROLLBACK TRANSACTION;

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'PAGO_CITA'


-- Verificar pacientes existentes
SELECT CURP, pac_nombre FROM PACIENTE WHERE CURP = 'PEGJ900515HDFRZN01';

-- Verificar estructura de la tabla CITA
SELECT COLUMN_NAME, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'CITA';

-- Verifica que el paciente existe exactamente con ese CURP
SELECT * FROM PACIENTE WHERE CURP = 'PEGJ900515HDFRZN01';

-- Verifica mayúsculas y espacios
SELECT CURP, LEN(CURP) as length FROM PACIENTE 
WHERE CURP LIKE '%PEGJ900515HDFRZN01%';


SELECT * FROM USUARIO

SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('CITA', 'CITA_ESTATUS', 'PAGO_CITA')


-- Actualizar TODOS los usuarios que tengan contraseña "123456" (hash viejo)
UPDATE USUARIO 
SET contrasena = HASHBYTES('SHA2_256', '123456')
WHERE contrasena = 0xEC278A38901287B2771A13739520384D43E4B078F78AFFE702DEF108774CCE24;

-- Verificar cuántos usuarios se actualizaron
SELECT COUNT(*) as usuarios_actualizados 
FROM USUARIO 
WHERE contrasena = "0xEC278A38901287B2771A13739520384D43E4B078F78AFFE702DEF108774CCE24";

-- Cambiar TODOS los hash viejos al nuevo en 1 comando
UPDATE USUARIO 
SET contrasena = HASHBYTES('SHA2_256', '123456')
WHERE contrasena = 0x8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92;

SELECT * FROM CITA

SELECT TOP 5 *
FROM CITA
ORDER BY folio_cita DESC;

SELECT 
    c.folio_cita,
    p.pac_nombre + ' ' + p.pac_paterno + ' ' + ISNULL(p.pac_materno, '') AS nombre_paciente,
    e.empleado_nombre + ' ' + e.empleado_paterno AS nombre_medico,
    esp.nombre_especialidad,
    c.cita_fechahora,
    cons.consultorio_numero,
    pc.pago_cantidadTotal
FROM CITA c
INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
INNER JOIN CONSULTORIO cons ON m.fk_id_consultorio = cons.id_consultorio
INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
WHERE c.folio_cita = 1028;


ALTER TABLE USUARIO
ADD correo VARCHAR(100);

-----------

SELECT * FROM CITA
SELECT * FROM CITA_ESTATUS


SELECT folio_cita, fk_id_citaEstatus
FROM CITA
WHERE folio_cita = 1;

SELECT 
    c.folio_cita,
    c.fk_id_citaEstatus,
    ce.estatusCita
FROM CITA c
LEFT JOIN CITA_ESTATUS ce ON c.fk_id_citaEstatus = ce.id_citaEstatus
WHERE c.folio_cita = 1;


sp_helptext 'VW_CitasCompletas';

SELECT * FROM CITA 
SELECT * FROM CITA_ESTATUS
UPDATE CITA
SET fk_id_citaEstatus = 1
WHERE folio_cita = 11;

SELECT * FROM PACIENTE WHERE CURP = 'PEGJ900515HDFRZN01';
SELECT * FROM PACIENTE

SELECT CURP FROM PACIENTE WHERE CURP = 'MAGJ900515HDFRZN02';

EXEC sp_agendarCitaCompleta 
    @curp = 'MAGJ900515HDFRZN02',
    @cedula = 'CED123456789',
    @fecha = '2025-06-29',
    @hora = '11:00',
    @especialidad_id = 1;

-- Ver si hay procesos bloqueando
sp_who2
GO

SELECT 
    blocking_session_id, wait_type, wait_time, text
FROM sys.dm_exec_requests
CROSS APPLY sys.dm_exec_sql_text(sql_handle)
WHERE session_id <> @@SPID;


SELECT TOP 1
    c.folio_cita,
    p.pac_nombre + ' ' + p.pac_paterno + ' ' + ISNULL(p.pac_materno, '') AS nombre_paciente,
    e.empleado_nombre + ' ' + e.empleado_paterno AS nombre_medico,
    esp.nombre_especialidad,
    c.cita_fechahora,
    cons.consultorio_numero,
    pc.pago_cantidadTotal
FROM CITA c
INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
INNER JOIN CONSULTORIO cons ON m.fk_id_consultorio = cons.id_consultorio
INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
WHERE c.fk_cita_CURP = 'MAGJ900515HDFRZN02'
  AND c.fk_cedula = 'CED123456789'
  AND c.cita_fechahora = '2025-06-29 11:00:00'
ORDER BY c.folio_cita DESC;

SELECT TOP 10 *
FROM CITA c
LEFT JOIN PAGO_CITA p ON c.id_pago = p.id_pago
LEFT JOIN MEDICO m ON c.fk_cedula = m.cedula
WHERE c.fk_cita_CURP = 'MAGJ900515HDFRZN02';


SELECT
    r.session_id,
    r.blocking_session_id,
    r.status,
    r.command,
    r.wait_type,
    r.wait_time,
    t.text AS sql_text
FROM sys.dm_exec_requests r
JOIN sys.dm_exec_sessions s ON r.session_id = s.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.session_id <> @@SPID;

EXEC sp_helpindex 'CITA';

SET STATISTICS TIME ON;

-- Usa el mismo query que tienes en getCitasPaciente,
-- pero con el CURP específico del paciente

DECLARE @paciente_curp VARCHAR(18) = 'MAGJ900515HDFRZN02';

-- (pon aquí tu query completo)

SET STATISTICS TIME OFF;


SELECT * FROM PACIENTE WHERE CURP = 'MAGJ900515HDFRZN02';
SELECT * FROM CITA WHERE fk_cita_CURP = 'MAGJ900515HDFRZN02';

SELECT 
  c.folio_cita,
  c.cita_fechahora,
  e.empleado_nombre + ' ' + e.empleado_paterno + ' ' + ISNULL(e.empleado_materno, '') AS nombre_medico,
  esp.nombre_especialidad,
  cons.consultorio_numero,
  c.fk_id_citaEstatus as id_citaEstatus,
  pc.pago_cantidadTotal,
  pc.pago_abonado,
  pc.estatuspago
FROM CITA c
INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
INNER JOIN CONSULTORIO cons ON m.fk_id_consultorio = cons.id_consultorio
INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
WHERE c.fk_cita_CURP = 'MAGJ900515HDFRZN02'
ORDER BY c.cita_fechahora DESC;

CREATE NONCLUSTERED INDEX IX_Cita_CURP
ON CITA (fk_cita_CURP);
