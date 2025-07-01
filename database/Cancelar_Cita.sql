-- ===============================
-- STORED PROCEDURE PARA CANCELAR CITA CON POLÍTICA DE DEVOLUCIÓN
-- ===============================

CREATE OR ALTER PROCEDURE sp_cancelarCitaConPolitica
    @folio_cita INT,
    @motivo_cancelacion NVARCHAR(500) = 'Cancelación por política',
    @porcentaje_devolucion DECIMAL(5,2) = 0,
    @monto_devolucion DECIMAL(10,2) = 0,
    @usuario_responsable NVARCHAR(100) = 'Sistema'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @paciente_curp NVARCHAR(18);
    DECLARE @medico_cedula NVARCHAR(20);
    DECLARE @nombre_paciente NVARCHAR(200);
    DECLARE @nombre_medico NVARCHAR(200);
    DECLARE @fecha_cita DATETIME;
    DECLARE @monto_original DECIMAL(10,2);
    DECLARE @descripcion_cancelacion NVARCHAR(1000);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 📋 OBTENER INFORMACIÓN DE LA CITA
        SELECT 
            @paciente_curp = c.fk_cita_CURP,
            @medico_cedula = c.fk_cedula,
            @fecha_cita = c.cita_fechahora,
            @monto_original = pc.pago_cantidadTotal,
            @nombre_paciente = CONCAT(p.pac_nombre, ' ', p.pac_paterno, ' ', ISNULL(p.pac_materno, '')),
            @nombre_medico = CONCAT(e.empleado_nombre, ' ', e.empleado_paterno, ' ', ISNULL(e.empleado_materno, ''))
        FROM CITA c
        INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
        INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
        INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
        INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
        WHERE c.folio_cita = @folio_cita;
        
        -- Verificar que la cita existe
        IF @paciente_curp IS NULL
        BEGIN
            RAISERROR('❌ Cita no encontrada', 16, 1);
            RETURN;
        END
        
        -- 🔄 ACTUALIZAR ESTATUS DE LA CITA A CANCELADA (ID = 4)
        UPDATE CITA 
        SET fk_id_citaEstatus = 4
        WHERE folio_cita = @folio_cita;
        
        -- 💰 ACTUALIZAR INFORMACIÓN DE PAGO SI HAY DEVOLUCIÓN
        IF @monto_devolucion > 0
        BEGIN
            UPDATE PAGO_CITA 
            SET 
                pago_abonado = pago_abonado - @monto_devolucion,
                estatuspago = CASE 
                    WHEN (pago_abonado - @monto_devolucion) <= 0 THEN 0 -- Pendiente si no queda nada pagado
                    ELSE estatuspago 
                END
            WHERE id_pago = (SELECT id_pago FROM CITA WHERE folio_cita = @folio_cita);
        END
        
        -- 📝 CREAR DESCRIPCIÓN DETALLADA
        SET @descripcion_cancelacion = CONCAT(
            'Cita cancelada por política de devolución. ',
            'Devolución: ', @porcentaje_devolucion, '% ($', @monto_devolucion, '). ',
            'Motivo: ', @motivo_cancelacion
        );
        
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
        ) VALUES (
            GETDATE(),
            'UPDATE',
            'CITA',
            @descripcion_cancelacion,
            @usuario_responsable,
            @paciente_curp,
            @nombre_paciente,
            @medico_cedula,
            @nombre_medico,
            @folio_cita,
            CONCAT(
                'Monto original: $', @monto_original, 
                ' | Porcentaje devolución: ', @porcentaje_devolucion, '%',
                ' | Monto devolución: $', @monto_devolucion,
                ' | Fecha original cita: ', FORMAT(@fecha_cita, 'yyyy-MM-dd HH:mm')
            )
        );
        
        -- ✅ CONFIRMAR TRANSACCIÓN
        COMMIT TRANSACTION;
        
        -- Retornar información del resultado
        SELECT 
            @folio_cita as folio_cita,
            4 as nuevo_estatus,
            'Cancelada' as nombre_estatus,
            @porcentaje_devolucion as porcentaje_devolucion,
            @monto_devolucion as monto_devolucion,
            @monto_original as monto_original,
            @descripcion_cancelacion as descripcion,
            @usuario_responsable as usuario_responsable,
            GETDATE() as fecha_cancelacion,
            '✅ Cita cancelada correctamente con política aplicada' as mensaje
        
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
-- FUNCIÓN PARA CALCULAR POLÍTICA DE DEVOLUCIÓN
-- ===============================

CREATE OR ALTER FUNCTION fn_calcularPoliticaDevolucion(
    @fecha_cita DATETIME,
    @monto_pagado DECIMAL(10,2)
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        @fecha_cita as fecha_cita,
        @monto_pagado as monto_pagado,
        DATEDIFF(HOUR, GETDATE(), @fecha_cita) as horas_anticipacion,
        CASE 
            WHEN DATEDIFF(HOUR, GETDATE(), @fecha_cita) >= 48 THEN 100
            WHEN DATEDIFF(HOUR, GETDATE(), @fecha_cita) >= 24 THEN 50
            ELSE 0
        END as porcentaje_devolucion,
        CASE 
            WHEN DATEDIFF(HOUR, GETDATE(), @fecha_cita) >= 48 THEN @monto_pagado
            WHEN DATEDIFF(HOUR, GETDATE(), @fecha_cita) >= 24 THEN @monto_pagado * 0.5
            ELSE 0
        END as monto_devolucion,
        CASE 
            WHEN DATEDIFF(HOUR, GETDATE(), @fecha_cita) >= 48 THEN 'Cancelación con 48+ horas de anticipación'
            WHEN DATEDIFF(HOUR, GETDATE(), @fecha_cita) >= 24 THEN 'Cancelación con 24-48 horas de anticipación'
            WHEN DATEDIFF(HOUR, GETDATE(), @fecha_cita) > 0 THEN 'Cancelación con menos de 24 horas de anticipación'
            ELSE 'Cancelación después de la fecha/hora programada'
        END as razon_devolucion
);

GO

SELECT * FROM USUARIO