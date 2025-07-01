-- ===============================
-- STORED PROCEDURE PARA ACTUALIZAR ESTATUS DE CITA
-- ===============================

CREATE OR ALTER PROCEDURE sp_actualizarEstatusCita
    @folio_cita INT,
    @nuevo_estatus INT,
    @motivo_cambio NVARCHAR(500) = NULL,
    @usuario_responsable NVARCHAR(100) = 'Sistema'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @estatus_actual INT;
    DECLARE @paciente_curp NVARCHAR(18);
    DECLARE @medico_cedula NVARCHAR(20);
    DECLARE @fecha_cita DATETIME;
    DECLARE @nombre_estatus_actual NVARCHAR(50);
    DECLARE @nombre_estatus_nuevo NVARCHAR(50);
    DECLARE @descripcion_cambio NVARCHAR(1000);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 📋 OBTENER INFORMACIÓN ACTUAL DE LA CITA
        SELECT 
            @estatus_actual = c.fk_id_citaEstatus,
            @paciente_curp = c.fk_cita_CURP,
            @medico_cedula = c.fk_cedula,
            @fecha_cita = c.cita_fechahora
        FROM CITA c
        WHERE c.folio_cita = @folio_cita;
        
        -- Verificar que la cita existe
        IF @estatus_actual IS NULL
        BEGIN
            RAISERROR('❌ Cita no encontrada con el folio especificado', 16, 1);
            RETURN;
        END
        
        -- Obtener nombres de estatus
        SELECT @nombre_estatus_actual = estatusCita 
        FROM CITA_ESTATUS 
        WHERE id_citaEstatus = @estatus_actual;
        
        SELECT @nombre_estatus_nuevo = estatusCita 
        FROM CITA_ESTATUS 
        WHERE id_citaEstatus = @nuevo_estatus;
        
        -- Verificar que el nuevo estatus existe
        IF @nombre_estatus_nuevo IS NULL
        BEGIN
            RAISERROR('❌ El estatus especificado no existe', 16, 1);
            RETURN;
        END
        
        -- 🔍 VALIDACIONES DE LÓGICA DE NEGOCIO
        
        -- No cambiar si ya tiene el mismo estatus
        IF @estatus_actual = @nuevo_estatus
        BEGIN
            RAISERROR('❌ La cita ya tiene el estatus especificado', 16, 1);
            RETURN;
        END
        
        -- No modificar citas ya atendidas (excepto correcciones administrativas)
        IF @estatus_actual = 6 AND @nuevo_estatus != 6
        BEGIN
            RAISERROR('❌ No se puede modificar el estatus de una cita ya atendida', 16, 1);
            RETURN;
        END
        
        -- Validaciones específicas por estatus
        IF @nuevo_estatus = 2 -- Pagada
        BEGIN
            IF @estatus_actual NOT IN (1, 3) -- Solo desde Agendada o Cancelada por Falta Pago
            BEGIN
                RAISERROR('❌ Solo se puede marcar como pagada una cita agendada o cancelada por falta de pago', 16, 1);
                RETURN;
            END
        END
        
        IF @nuevo_estatus = 6 -- Atendida
        BEGIN
            IF @estatus_actual NOT IN (1, 2) -- Solo desde Agendada o Pagada
            BEGIN
                RAISERROR('❌ Solo se puede marcar como atendida una cita agendada o pagada', 16, 1);
                RETURN;
            END
        END
        
        IF @nuevo_estatus = 7 -- No Acudió
        BEGIN
            -- Solo para citas pasadas
            IF @fecha_cita >= GETDATE()
            BEGIN
                RAISERROR('❌ Solo se puede marcar como "No Acudió" citas que ya pasaron', 16, 1);
                RETURN;
            END
            
            -- No si ya fue atendida
            IF @estatus_actual = 6
            BEGIN
                RAISERROR('❌ No se puede marcar como "No Acudió" una cita ya atendida', 16, 1);
                RETURN;
            END
        END
        
        -- 🔄 ACTUALIZAR ESTATUS DE LA CITA
        UPDATE CITA 
        SET fk_id_citaEstatus = @nuevo_estatus
        WHERE folio_cita = @folio_cita;
        
        -- 📝 CREAR DESCRIPCIÓN DEL CAMBIO
        SET @descripcion_cambio = CONCAT(
            'Estatus de cita actualizado de "', @nombre_estatus_actual, 
            '" a "', @nombre_estatus_nuevo, '"'
        );
        
        IF @motivo_cambio IS NOT NULL AND LEN(@motivo_cambio) > 0
        BEGIN
            SET @descripcion_cambio = CONCAT(@descripcion_cambio, '. Motivo: ', @motivo_cambio);
        END
        
        -- 📋 REGISTRAR EN BITÁCORA
        INSERT INTO BITACORA (
            fecha_movimiento,
            tipo_movimiento,
            tabla_afectada,
            descripcion,
            usuario_responsable,
            paciente_id,
            paciente_nombre,
            medico_cedula,
            medico_nombre,
            folio_cita,
            detalles_adicionales
        )
        SELECT 
            GETDATE(),
            'UPDATE',
            'CITA',
            @descripcion_cambio,
            @usuario_responsable,
            @paciente_curp,
            CONCAT(p.pac_nombre, ' ', p.pac_paterno, ' ', ISNULL(p.pac_materno, '')),
            @medico_cedula,
            CONCAT(e.empleado_nombre, ' ', e.empleado_paterno, ' ', ISNULL(e.empleado_materno, '')),
            @folio_cita,
            CONCAT(
                'Estatus anterior: ', @nombre_estatus_actual, 
                ' | Estatus nuevo: ', @nombre_estatus_nuevo,
                CASE WHEN @motivo_cambio IS NOT NULL THEN CONCAT(' | Motivo: ', @motivo_cambio) ELSE '' END
            )
        FROM PACIENTE p
        CROSS JOIN (
            SELECT 
                e.empleado_nombre, 
                e.empleado_paterno, 
                e.empleado_materno
            FROM MEDICO m
            INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
            WHERE m.cedula = @medico_cedula
        ) e
        WHERE p.CURP = @paciente_curp;
        
        -- ✅ CONFIRMAR TRANSACCIÓN
        COMMIT TRANSACTION;
        
        -- Retornar información del cambio
        SELECT 
            @folio_cita as folio_cita,
            @estatus_actual as estatus_anterior_id,
            @nombre_estatus_actual as estatus_anterior_nombre,
            @nuevo_estatus as estatus_nuevo_id,
            @nombre_estatus_nuevo as estatus_nuevo_nombre,
            @descripcion_cambio as descripcion_cambio,
            @usuario_responsable as usuario_responsable,
            GETDATE() as fecha_cambio,
            '✅ Estatus actualizado correctamente' as mensaje
        
    END TRY
    BEGIN CATCH
        -- ❌ ROLLBACK EN CASO DE ERROR
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;

GO

-- ===============================
-- PROCEDURE PARA VALIDAR CAMBIOS DE ESTATUS
-- ===============================

CREATE OR ALTER PROCEDURE sp_validarCambioEstatus
    @folio_cita INT,
    @nuevo_estatus INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @estatus_actual INT;
    DECLARE @fecha_cita DATETIME;
    DECLARE @resultado BIT = 1;
    DECLARE @mensaje NVARCHAR(500) = 'Cambio permitido';
    
    -- Obtener información actual
    SELECT 
        @estatus_actual = fk_id_citaEstatus,
        @fecha_cita = cita_fechahora
    FROM CITA 
    WHERE folio_cita = @folio_cita;
    
    -- Validaciones
    IF @estatus_actual IS NULL
    BEGIN
        SET @resultado = 0;
        SET @mensaje = 'Cita no encontrada';
    END
    ELSE IF @estatus_actual = @nuevo_estatus
    BEGIN
        SET @resultado = 0;
        SET @mensaje = 'La cita ya tiene ese estatus';
    END
    ELSE IF @estatus_actual = 6 AND @nuevo_estatus != 6
    BEGIN
        SET @resultado = 0;
        SET @mensaje = 'No se puede modificar una cita ya atendida';
    END
    ELSE IF @nuevo_estatus = 7 AND @fecha_cita >= GETDATE()
    BEGIN
        SET @resultado = 0;
        SET @mensaje = 'Solo se puede marcar como "No Acudió" citas pasadas';
    END
    
    -- Retornar resultado
    SELECT 
        @resultado as es_valido,
        @mensaje as mensaje,
        @estatus_actual as estatus_actual,
        @nuevo_estatus as estatus_propuesto,
        @folio_cita as folio_cita
END;

GO