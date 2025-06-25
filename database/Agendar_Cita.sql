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

    DECLARE @fechaHora DATETIME = DATETIMEFROMPARTS(
        YEAR(@fecha), MONTH(@fecha), DAY(@fecha),
        DATEPART(HOUR, @hora), DATEPART(MINUTE, @hora), 0, 0
    );

    -- Validación 1: El paciente ya tiene una cita ese día con ese doctor
    IF EXISTS (
        SELECT 1 FROM CITA
        WHERE fk_cita_CURP = @curp
          AND fk_cedula = @cedula
          AND fk_id_citaEstatus IN (1, 2)
          AND CAST(cita_fechahora AS DATE) = @fecha
    )
    BEGIN
        RAISERROR('El paciente ya tiene una cita con ese doctor ese día.', 16, 1);
        RETURN;
    END

    -- Validación 2: El doctor ya tiene una cita en esa hora exacta
    IF EXISTS (
        SELECT 1 FROM CITA
        WHERE fk_cedula = @cedula
          AND cita_fechahora = @fechaHora
          AND fk_id_citaEstatus IN (1, 2)
    )
    BEGIN
        RAISERROR('El doctor ya tiene una cita en ese horario.', 16, 1);
        RETURN;
    END

    -- Validación 3: El doctor tiene horario válido a esa hora
    IF NOT EXISTS (
        SELECT 1 FROM EMPLEADO E
        JOIN HORARIO H ON E.fk_id_horario = H.id_horario
        JOIN MEDICO M ON M.fk_med_id_empleado = E.id_empleado
        WHERE M.cedula = @cedula
          AND @hora BETWEEN H.horario_inicio AND H.horario_fin
    )
    BEGIN
        RAISERROR('La hora está fuera del horario laboral del doctor.', 16, 1);
        RETURN;
    END

    -- Obtener costo
    DECLARE @costo MONEY;
    SELECT @costo = costo_especialidad FROM ESPECIALIDAD WHERE id_especialidad = @especialidad_id;

    IF @costo IS NULL
    BEGIN
        RAISERROR('Especialidad no encontrada.', 16, 1);
        RETURN;
    END

    -- Crear pago
    DECLARE @pagoId INT;
    INSERT INTO PAGO_CITA (pago_cantidadTotal, pago_abonado, estatuspago, pago_fechaHora)
    VALUES (@costo, 0, 0, GETDATE());
    SET @pagoId = SCOPE_IDENTITY();

    -- Crear cita
    DECLARE @folio_cita INT;
    INSERT INTO CITA (fk_cita_CURP, fk_cedula, fk_id_citaEstatus, id_pago, cita_fechahora)
    VALUES (@curp, @cedula, 1, @pagoId, @fechaHora);
    SET @folio_cita = SCOPE_IDENTITY();

    -- Esperar medio segundo para asegurar visibilidad de datos (opcional pero útil)
    WAITFOR DELAY '00:00:00.500';

    -- Devolver comprobante de cita
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
    WHERE c.fk_cita_CURP = @curp
      AND c.fk_cedula = @cedula
      AND c.cita_fechahora = @fechaHora
    ORDER BY c.folio_cita DESC;
END;
GO
