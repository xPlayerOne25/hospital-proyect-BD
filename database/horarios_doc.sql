-- =====================================================
-- SISTEMA DE HORARIOS DISPONIBLES POR DOCTOR
-- =====================================================

USE HospitalDB;

-- 1️⃣ STORED PROCEDURE: Obtener horarios disponibles de un doctor
IF OBJECT_ID('sp_obtenerHorariosDisponibles', 'P') IS NOT NULL
    DROP PROCEDURE sp_obtenerHorariosDisponibles;
GO

CREATE PROCEDURE sp_obtenerHorariosDisponibles
    @cedula VARCHAR(20),
    @fecha DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Verificar que el médico existe
        IF NOT EXISTS (SELECT 1 FROM MEDICO WHERE cedula = @cedula)
        BEGIN
            RAISERROR('Médico no encontrado', 16, 1);
            RETURN;
        END
        
        -- Obtener horario laboral del médico
        DECLARE @horario_inicio TIME, @horario_fin TIME;
        
        SELECT 
            @horario_inicio = H.horario_inicio,
            @horario_fin = H.horario_fin
        FROM MEDICO M
        INNER JOIN EMPLEADO E ON M.fk_med_id_empleado = E.id_empleado
        INNER JOIN HORARIO H ON E.fk_id_horario = H.id_horario
        WHERE M.cedula = @cedula;
        
        -- Generar tabla temporal con horarios cada 30 minutos
        DECLARE @horarios_temp TABLE (
            hora_inicio TIME,
            hora_fin TIME,
            hora_display VARCHAR(20),
            disponible BIT
        );
        
        -- Generar horarios cada 30 minutos dentro del horario laboral
        DECLARE @hora_actual TIME = @horario_inicio;
        DECLARE @fecha_hora_check DATETIME;
        
        WHILE @hora_actual < @horario_fin
        BEGIN
            -- Construir datetime para verificar disponibilidad
            SET @fecha_hora_check = CAST(CONCAT(CAST(@fecha AS VARCHAR(10)), ' ', CAST(@hora_actual AS VARCHAR(8))) AS DATETIME);
            
            -- Verificar si está disponible (no tiene cita en esa hora)
            DECLARE @disponible BIT = 1;
            
            IF EXISTS (
                SELECT 1 FROM CITA 
                WHERE fk_cedula = @cedula 
                  AND cita_fechahora = @fecha_hora_check
                  AND fk_id_citaEstatus IN (1, 2) -- Pendiente o Pagada
            )
            BEGIN
                SET @disponible = 0;
            END
            
            -- Agregar horario a la tabla temporal
            INSERT INTO @horarios_temp (hora_inicio, hora_fin, hora_display, disponible)
            VALUES (
                @hora_actual,
                DATEADD(MINUTE, 30, @hora_actual),
                FORMAT(@hora_actual, 'HH:mm') + ' - ' + FORMAT(DATEADD(MINUTE, 30, @hora_actual), 'HH:mm'),
                @disponible
            );
            
            -- Incrementar 30 minutos
            SET @hora_actual = DATEADD(MINUTE, 30, @hora_actual);
        END
        
        -- Devolver solo horarios disponibles
        SELECT 
            hora_inicio,
            hora_display,
            disponible,
            CASE WHEN disponible = 1 THEN '✅ Disponible' ELSE '❌ Ocupado' END AS estado
        FROM @horarios_temp
        WHERE disponible = 1  -- Solo horarios disponibles
        ORDER BY hora_inicio;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- 2️⃣ STORED PROCEDURE: Obtener información completa del doctor con horarios
IF OBJECT_ID('sp_obtenerDoctorConHorarios', 'P') IS NOT NULL
    DROP PROCEDURE sp_obtenerDoctorConHorarios;
GO

CREATE PROCEDURE sp_obtenerDoctorConHorarios
    @cedula VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Información básica del doctor
    SELECT 
        m.cedula,
        CONCAT(e.empleado_nombre, ' ', e.empleado_paterno, ' ', ISNULL(e.empleado_materno, '')) AS nombre_completo,
        esp.nombre_especialidad,
        esp.costo_especialidad,
        c.consultorio_numero,
        h.horario_inicio,
        h.horario_fin,
        CASE 
            WHEN h.horario_turno = 0 THEN 'Matutino'
            WHEN h.horario_turno = 1 THEN 'Vespertino'
            ELSE 'Mixto'
        END AS turno,
        CONCAT(
            FORMAT(h.horario_inicio, 'HH:mm'), 
            ' - ', 
            FORMAT(h.horario_fin, 'HH:mm')
        ) AS horario_display
    FROM MEDICO m
    INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
    INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
    INNER JOIN CONSULTORIO c ON m.fk_id_consultorio = c.id_consultorio
    INNER JOIN HORARIO h ON e.fk_id_horario = h.id_horario
    WHERE m.cedula = @cedula AND e.fk_id_empleadoEstatus = 1;
END;
GO

-- 3️⃣ FUNCIÓN PARA GENERAR PRÓXIMAS FECHAS DISPONIBLES
IF OBJECT_ID('fn_obtenerProximasFechas', 'FN') IS NOT NULL
    DROP FUNCTION fn_obtenerProximasFechas;
GO

CREATE FUNCTION fn_obtenerProximasFechas()
RETURNS @fechas TABLE (
    fecha DATE,
    fecha_display VARCHAR(50),
    dia_semana VARCHAR(20),
    es_hoy BIT,
    es_manana BIT
)
AS
BEGIN
    DECLARE @fecha_actual DATE = CAST(GETDATE() AS DATE);
    DECLARE @fecha_minima DATE = DATEADD(DAY, 2, @fecha_actual); -- Mínimo 48 horas
    DECLARE @fecha_maxima DATE = DATEADD(MONTH, 3, @fecha_actual); -- Máximo 3 meses
    
    DECLARE @contador INT = 0;
    DECLARE @fecha_temp DATE = @fecha_minima;
    
    -- Generar próximas 30 fechas disponibles (excluyendo domingos)
    WHILE @contador < 30 AND @fecha_temp <= @fecha_maxima
    BEGIN
        -- Excluir domingos (DATEPART(WEEKDAY) = 1)
        IF DATEPART(WEEKDAY, @fecha_temp) != 1
        BEGIN
            INSERT INTO @fechas (fecha, fecha_display, dia_semana, es_hoy, es_manana)
            VALUES (
                @fecha_temp,
                FORMAT(@fecha_temp, 'dd/MM/yyyy'),
                CASE DATEPART(WEEKDAY, @fecha_temp)
                    WHEN 2 THEN 'Lunes'
                    WHEN 3 THEN 'Martes'
                    WHEN 4 THEN 'Miércoles'
                    WHEN 5 THEN 'Jueves'
                    WHEN 6 THEN 'Viernes'
                    WHEN 7 THEN 'Sábado'
                END,
                CASE WHEN @fecha_temp = @fecha_actual THEN 1 ELSE 0 END,
                CASE WHEN @fecha_temp = DATEADD(DAY, 1, @fecha_actual) THEN 1 ELSE 0 END
            );
            
            SET @contador = @contador + 1;
        END
        
        SET @fecha_temp = DATEADD(DAY, 1, @fecha_temp);
    END
    
    RETURN;
END;
GO

-- 4️⃣ PRUEBAS DEL SISTEMA
PRINT '🧪 === PRUEBAS DEL SISTEMA DE HORARIOS ===';

-- Prueba 1: Obtener información de un doctor
PRINT '';
PRINT '👨‍⚕️ Información del doctor:';
EXEC sp_obtenerDoctorConHorarios @cedula = 'CED123456789';

-- Prueba 2: Obtener horarios disponibles para mañana
DECLARE @fecha_prueba DATE = DATEADD(DAY, 2, GETDATE());
PRINT '';
PRINT CONCAT('📅 Horarios disponibles para ', @fecha_prueba, ':');
EXEC sp_obtenerHorariosDisponibles 
    @cedula = 'CED123456789',
    @fecha = @fecha_prueba;

-- Prueba 3: Ver próximas fechas disponibles
PRINT '';
PRINT '📅 Próximas fechas disponibles:';
SELECT TOP 10 
    fecha,
    fecha_display,
    dia_semana
FROM fn_obtenerProximasFechas()
ORDER BY fecha;

PRINT '';
PRINT '🎉 === SISTEMA DE HORARIOS DISPONIBLES LISTO ===';
PRINT '✅ sp_obtenerDoctorConHorarios - Info completa del doctor';
PRINT '✅ sp_obtenerHorariosDisponibles - Horarios libres por fecha';
PRINT '✅ fn_obtenerProximasFechas - Fechas válidas para agendar';


SELECT * FROM EMPLEADO
SELECT * FROM MEDICO
SELECT * FROM EMPLEADO_ESTATUS
SELECT * FROM HORARIO
SELECT * FROM CITA


EXEC sp_obtenerHorariosDisponibles 'CED789123456', '2025-08-31';
EXEC sp_obtenerHorariosDisponibles 'CED486159753', '2025-07-02';

SELECT 
    M.cedula,
    E.id_empleado,
    H.horario_inicio,
    H.horario_fin
FROM MEDICO M
JOIN EMPLEADO E ON M.fk_med_id_empleado = E.id_empleado
JOIN HORARIO H ON E.fk_id_horario = H.id_horario
WHERE M.cedula = 'CED486159753';

SELECT COUNT(*) AS total_citas
FROM CITA
WHERE fk_cedula = 'CED486159753'
  AND CAST(cita_fechahora AS DATE) = '2025-07-02';

UPDATE H
SET horario_fin = '22:00'
FROM HORARIO H
JOIN EMPLEADO E ON H.id_horario = E.fk_id_horario
JOIN MEDICO M ON E.id_empleado = M.fk_med_id_empleado
WHERE M.cedula = 'CED486159753';



SELECT folio_cita, cita_fechahora
FROM CITA
ORDER BY cita_fechahora DESC;
