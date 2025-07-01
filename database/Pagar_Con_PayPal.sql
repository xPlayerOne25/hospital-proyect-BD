-- =====================================================
-- PASO 1: CREAR STORED PROCEDURE PARA PAYPAL
-- =====================================================

-- Crear SP para registrar pago PayPal y actualizar estatus
IF OBJECT_ID('sp_registrarPagoPaypal', 'P') IS NOT NULL
    DROP PROCEDURE sp_registrarPagoPaypal;
GO

CREATE PROCEDURE sp_registrarPagoPaypal
    @folio_cita INT,
    @monto DECIMAL(10,2),
    @payer_email VARCHAR(100),
    @paypal_id VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la cita existe
        IF NOT EXISTS (SELECT 1 FROM CITA WHERE folio_cita = @folio_cita)
        BEGIN
            RAISERROR('Cita no encontrada', 16, 1);
            RETURN;
        END
        
        -- Obtener el ID del pago asociado a la cita
        DECLARE @id_pago INT;
        SELECT @id_pago = id_pago FROM CITA WHERE folio_cita = @folio_cita;
        
        -- 🔧 ACTUALIZAR EL PAGO
        UPDATE PAGO_CITA 
        SET 
            pago_abonado = @monto,
            estatuspago = 1,  -- 1 = Pagado
            pago_fechaHora = GETDATE()
        WHERE id_pago = @id_pago;
        
        -- 🔧 ACTUALIZAR ESTATUS DE LA CITA A "PAGADA"
        UPDATE CITA 
        SET fk_id_citaEstatus = 2  -- 2 = Pagada/Pendiente por atender
        WHERE folio_cita = @folio_cita;
        
        -- Crear tabla de logs PayPal si no existe
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PAYPAL_LOGS')
        BEGIN
            CREATE TABLE PAYPAL_LOGS (
                id INT IDENTITY(1,1) PRIMARY KEY,
                folio_cita INT NOT NULL,
                paypal_id VARCHAR(100) NOT NULL,
                payer_email VARCHAR(100),
                monto DECIMAL(10,2) NOT NULL,
                fecha_pago DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (folio_cita) REFERENCES CITA(folio_cita)
            );
        END
        
        -- Registrar log del pago PayPal
        INSERT INTO PAYPAL_LOGS (folio_cita, paypal_id, payer_email, monto)
        VALUES (@folio_cita, @paypal_id, @payer_email, @monto);
        
        COMMIT TRANSACTION;
        
        PRINT CONCAT('✅ Pago PayPal registrado - Folio: ', @folio_cita, ', Monto: $', @monto);
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =====================================================
-- PASO 2: CREAR SP PARA PAGO CON TARJETA
-- =====================================================

IF OBJECT_ID('sp_registrarPagoTarjeta', 'P') IS NOT NULL
    DROP PROCEDURE sp_registrarPagoTarjeta;
GO

CREATE PROCEDURE sp_registrarPagoTarjeta
    @folio_cita INT,
    @nombre VARCHAR(100),
    @numero VARCHAR(20),
    @vencimiento VARCHAR(10),
    @cvv VARCHAR(5)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la cita existe
        IF NOT EXISTS (SELECT 1 FROM CITA WHERE folio_cita = @folio_cita)
        BEGIN
            RAISERROR('Cita no encontrada', 16, 1);
            RETURN;
        END
        
        -- Obtener el monto y ID del pago
        DECLARE @id_pago INT, @monto DECIMAL(10,2);
        SELECT @id_pago = c.id_pago, @monto = pc.pago_cantidadTotal
        FROM CITA c
        INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
        WHERE c.folio_cita = @folio_cita;
        
        -- 🔧 ACTUALIZAR EL PAGO
        UPDATE PAGO_CITA 
        SET 
            pago_abonado = @monto,
            estatuspago = 1,  -- 1 = Pagado
            pago_fechaHora = GETDATE()
        WHERE id_pago = @id_pago;
        
        -- 🔧 ACTUALIZAR ESTATUS DE LA CITA A "PAGADA"
        UPDATE CITA 
        SET fk_id_citaEstatus = 2  -- 2 = Pagada/Pendiente por atender
        WHERE folio_cita = @folio_cita;
        
        COMMIT TRANSACTION;
        
        PRINT CONCAT('✅ Pago con tarjeta registrado - Folio: ', @folio_cita, ', Monto: $', @monto);
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =====================================================
-- PASO 3: VERIFICAR ESTATUS DE CITAS
-- =====================================================

-- Ver los estatus disponibles
SELECT * FROM CITA_ESTATUS ORDER BY id_citaEstatus;

-- Verificar que tienes los estatus correctos
IF NOT EXISTS (SELECT 1 FROM CITA_ESTATUS WHERE id_citaEstatus = 2)
BEGIN
    PRINT '⚠️ Falta estatus "Pagada" con ID 2';
    -- Agregar si no existe
    INSERT INTO CITA_ESTATUS (estatusCita, descripcion) 
    VALUES ('Pagada', 'Cita pagada pendiente por atender');
END

PRINT '✅ Stored procedures creados exitosamente';
PRINT '🧪 Prueba con: EXEC sp_registrarPagoPaypal @folio_cita=1, @monto=750.00, @payer_email=''test@test.com'', @paypal_id=''TEST123''';
