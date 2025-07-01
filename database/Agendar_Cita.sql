-- =====================================================
-- MODIFICAR REGLAS DE NEGOCIO - MÚLTIPLES CITAS POR DOCTOR
-- =====================================================

USE HospitalDB;

-- Recrear el SP con reglas más flexibles
IF OBJECT_ID('sp_agendarCitaCompleta', 'P') IS NOT NULL
    DROP PROCEDURE sp_agendarCitaCompleta;
GO

CREATE PROCEDURE sp_agendarCitaCompleta
    @curp VARCHAR(18),
    @cedula VARCHAR(20),
    @fecha DATE,
    @hora TIME,
    @especialidad_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- ✅ CONVERSIÓN SEGURA DE FECHA Y HORA
        DECLARE @fechaHora DATETIME;
        SET @fechaHora = CAST(CONCAT(CAST(@fecha AS VARCHAR(10)), ' ', CAST(@hora AS VARCHAR(8))) AS DATETIME);
        
        -- ✅ VALIDACIONES BÁSICAS
        IF @curp IS NULL OR @cedula IS NULL OR @fecha IS NULL OR @hora IS NULL OR @especialidad_id IS NULL
        BEGIN
            RAISERROR('Todos los parámetros son obligatorios', 16, 1);
            RETURN;
        END
        
        -- ✅ VALIDAR FECHA NO PASADA
        IF @fecha < CAST(GETDATE() AS DATE)
        BEGIN
            RAISERROR('No se puede agendar una cita con fecha pasada', 16, 1);
            RETURN;
        END
        
        -- ✅ VALIDAR RANGO DE FECHAS (48 horas - 3 meses)
        DECLARE @fechaMinima DATETIME = DATEADD(HOUR, 48, GETDATE());
        DECLARE @fechaMaxima DATETIME = DATEADD(MONTH, 3, GETDATE());
        
        IF @fechaHora < @fechaMinima
        BEGIN
            RAISERROR('La cita debe agendarse con mínimo 48 horas de anticipación', 16, 1);
            RETURN;
        END
        
        IF @fechaHora > @fechaMaxima
        BEGIN
            RAISERROR('No se puede agendar con más de 3 meses de anticipación', 16, 1);
            RETURN;
        END
        
        -- ✅ VERIFICAR QUE EL PACIENTE EXISTE
        IF NOT EXISTS (SELECT 1 FROM PACIENTE WHERE CURP = @curp)
        BEGIN
            RAISERROR('El paciente no existe', 16, 1);
            RETURN;
        END
        
        -- ✅ VERIFICAR QUE EL MÉDICO EXISTE Y ESTÁ ACTIVO
        IF NOT EXISTS (
            SELECT 1 FROM MEDICO M 
            INNER JOIN EMPLEADO E ON M.fk_med_id_empleado = E.id_empleado 
            WHERE M.cedula = @cedula AND E.fk_id_empleadoEstatus = 1
        )
        BEGIN
            RAISERROR('El médico no existe o no está activo', 16, 1);
            RETURN;
        END
        
        -- ✅ VERIFICAR QUE LA ESPECIALIDAD COINCIDE
        IF NOT EXISTS (
            SELECT 1 FROM MEDICO M 
            WHERE M.cedula = @cedula AND M.fk_id_especialidad = @especialidad_id
        )
        BEGIN
            RAISERROR('La especialidad no corresponde al médico seleccionado', 16, 1);
            RETURN;
        END
        
        -- 🆕 VALIDACIÓN MEJORADA 1: Solo bloquear si es EXACTAMENTE el mismo horario (cualquier doctor)
        IF EXISTS (
            SELECT 1 FROM CITA
            WHERE fk_cita_CURP = @curp
              AND cita_fechahora = @fechaHora
              AND fk_id_citaEstatus IN (1, 2) -- Pendiente pago o Pendiente atender
        )
        BEGIN
            RAISERROR('El paciente ya tiene una cita en ese horario exacto', 16, 1);
            RETURN;
        END
        
        -- 🆕 VALIDACIÓN MEJORADA 2: Doctor NO puede tener cita en el MISMO horario con OTRO paciente
        IF EXISTS (
            SELECT 1 FROM CITA
            WHERE fk_cedula = @cedula
              AND cita_fechahora = @fechaHora
              AND fk_id_citaEstatus IN (1, 2)
        )
        BEGIN
            RAISERROR('El doctor ya tiene una cita en ese horario', 16, 1);
            RETURN;
        END
        
        -- ✅ VERIFICAR HORARIO LABORAL DEL MÉDICO
        IF NOT EXISTS (
            SELECT 1
            FROM EMPLEADO E
            INNER JOIN HORARIO H ON E.fk_id_horario = H.id_horario
            INNER JOIN MEDICO M ON M.fk_med_id_empleado = E.id_empleado
            WHERE M.cedula = @cedula
              AND @hora BETWEEN H.horario_inicio AND H.horario_fin
        )
        BEGIN
            RAISERROR('La hora está fuera del horario laboral del doctor', 16, 1);
            RETURN;
        END
        
        -- ✅ OBTENER COSTO DE LA ESPECIALIDAD
        DECLARE @costo MONEY;
        SELECT @costo = costo_especialidad 
        FROM ESPECIALIDAD 
        WHERE id_especialidad = @especialidad_id;
        
        IF @costo IS NULL
        BEGIN
            RAISERROR('Especialidad no encontrada', 16, 1);
            RETURN;
        END
        
        -- ✅ CREAR REGISTRO DE PAGO
        DECLARE @pagoId INT;
        INSERT INTO PAGO_CITA (pago_cantidadTotal, pago_abonado, estatuspago, pago_fechaHora)
        VALUES (@costo, 0, 0, GETDATE());
        SET @pagoId = SCOPE_IDENTITY();
        
        -- ✅ CREAR LA CITA
        DECLARE @folio_cita INT;
        INSERT INTO CITA (fk_cita_CURP, fk_cedula, fk_id_citaEstatus, id_pago, cita_fechahora)
        VALUES (@curp, @cedula, 1, @pagoId, @fechaHora);
        SET @folio_cita = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- ✅ DEVOLVER COMPROBANTE
SELECT 
    c.folio_cita,
    CONCAT(p.pac_nombre, ' ', p.pac_paterno, ' ', ISNULL(p.pac_materno, '')) AS nombre_paciente,
    CONCAT(e.empleado_nombre, ' ', e.empleado_paterno, ' ', ISNULL(e.empleado_materno, '')) AS nombre_medico,
    esp.nombre_especialidad,
    c.cita_fechahora,
    FORMAT(c.cita_fechahora, 'dd/MM/yyyy', 'es-MX') AS fecha_formateada,
    FORMAT(c.cita_fechahora, 'hh:mm tt', 'es-MX') AS hora_formateada,
    cons.consultorio_numero,
    pc.pago_cantidadTotal
FROM CITA c
INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
INNER JOIN CONSULTORIO cons ON m.fk_id_consultorio = cons.id_consultorio
INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
WHERE c.folio_cita = @folio_cita;

        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- 🧪 PRUEBA CON LAS NUEVAS REGLAS
PRINT '🧪 === PROBANDO NUEVAS REGLAS DE NEGOCIO ===';

-- Prueba 1: Crear cita con doctor que ya tiene otra cita pendiente (debe funcionar)
BEGIN TRY
    EXEC sp_agendarCitaCompleta 
        @curp = 'PEGJ900515HDFRZN01',
        @cedula = 'CED789123456',
        @fecha = '2025-08-31',
        @hora = '17:00',
        @especialidad_id = 4;
        
    PRINT '✅ PRUEBA 1 EXITOSA: Múltiples citas con mismo doctor funcionan';
END TRY
BEGIN CATCH
    PRINT '❌ PRUEBA 1 FALLÓ:';
    PRINT ERROR_MESSAGE();
END CATCH

-- Prueba 2: Intentar crear cita en el mismo horario exacto (debe fallar)
BEGIN TRY
    EXEC sp_agendarCitaCompleta 
        @curp = 'PEGJ900515HDFRZN01',
        @cedula = 'CED789123456',
        @fecha = '2025-08-31',
        @hora = '17:00',  -- Mismo horario que la prueba anterior
        @especialidad_id = 4;
        
    PRINT '❌ PRUEBA 2 INESPERADA: Debería haber fallado por mismo horario';
END TRY
BEGIN CATCH
    PRINT '✅ PRUEBA 2 CORRECTA: Bloquea mismo horario exacto';
    PRINT 'Error esperado: ' + ERROR_MESSAGE();
END CATCH

-- Prueba 3: Crear otra cita con el mismo doctor pero horario diferente (debe funcionar)
BEGIN TRY
    EXEC sp_agendarCitaCompleta 
        @curp = 'PEGJ900515HDFRZN01',
        @cedula = 'CED789123456',
        @fecha = '2025-09-01',
        @hora = '10:00',  -- Horario diferente
        @especialidad_id = 4;
        
    PRINT '✅ PRUEBA 3 EXITOSA: Múltiples citas con mismo doctor en horarios diferentes';
END TRY
BEGIN CATCH
    PRINT '❌ PRUEBA 3 FALLÓ:';
    PRINT ERROR_MESSAGE();
END CATCH

PRINT '';
PRINT '🎉 === NUEVAS REGLAS DE NEGOCIO IMPLEMENTADAS ===';
PRINT '✅ PERMITE: Múltiples citas con el mismo doctor en horarios diferentes';
PRINT '❌ BLOQUEA: Citas en el mismo horario exacto';
PRINT '❌ BLOQUEA: Doctor ocupado en el mismo horario con otro paciente';
PRINT '';
PRINT '🚀 ¡Tu frontend ahora puede crear múltiples citas sin problemas!';

SELECT * FROM CITA

SELECT 
  folio_cita,
  cita_fechahora,
  FORMAT(cita_fechahora, 'hh:mm tt', 'es-MX') AS hora_formateada
FROM CITA
ORDER BY cita_fechahora DESC;
