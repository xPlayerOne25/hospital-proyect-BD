IF OBJECT_ID('sp_cancelarCitaRecepcion', 'P') IS NOT NULL
    DROP PROCEDURE sp_cancelarCitaRecepcion;
GO

CREATE PROCEDURE sp_cancelarCitaRecepcion
    @folio_cita VARCHAR(20),
    @motivo VARCHAR(10) -- 'paciente' o 'doctor'
AS
BEGIN
    DECLARE @fecha_cita DATETIME,
            @costo DECIMAL(10,2),
            @id_especialidad INT,
            @horas_restantes INT,
            @monto_devuelto DECIMAL(10,2),
            @politica VARCHAR(10),
            @nuevo_estatus INT;

    -- 1. Obtener info de la cita
    SELECT 
        @fecha_cita = c.cita_fechahora,
        @costo = e.costo_especialidad,
        @id_especialidad = e.id_especialidad
    FROM CITA c
    INNER JOIN MEDICO d ON c.fk_cedula = d.cedula
    INNER JOIN ESPECIALIDAD e ON d.fk_id_especialidad = e.id_especialidad
    WHERE c.folio_cita = @folio_cita;

    IF @fecha_cita IS NULL
    BEGIN
        RAISERROR('Cita no encontrada.', 16, 1);
        RETURN;
    END

    -- 2. Calcular horas restantes
    SET @horas_restantes = DATEDIFF(HOUR, GETDATE(), @fecha_cita);

    -- 3. Determinar política
    IF @horas_restantes >= 48
    BEGIN
        SET @monto_devuelto = @costo;
        SET @politica = '100%';
    END
    ELSE IF @horas_restantes >= 24
    BEGIN
        SET @monto_devuelto = @costo * 0.5;
        SET @politica = '50%';
    END
    ELSE
    BEGIN
        SET @monto_devuelto = 0;
        SET @politica = '0%';
    END

    -- 4. Asignar estatus
    SET @nuevo_estatus = CASE 
        WHEN @motivo = 'doctor' THEN 5
        ELSE 4
    END;

    -- 5. Actualizar cita
    UPDATE CITA
    SET fk_id_citaEstatus = @nuevo_estatus
    WHERE folio_cita = @folio_cita;

    -- 6. Insertar en bitácora
    INSERT INTO BITACORA_CANCELACION (
        folio_cita,
        fecha_mov,
        fecha_cita,
        id_especialidad,
        costo,
        politica_cancela,
        monto_devuelto
    )
    VALUES (
        @folio_cita,
        GETDATE(),
        @fecha_cita,
        @id_especialidad,
        @costo,
        @politica,
        @monto_devuelto
    );
END;
GO
