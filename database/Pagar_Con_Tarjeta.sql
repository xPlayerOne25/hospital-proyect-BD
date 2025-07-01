ALTER PROCEDURE sp_registrarPagoTarjeta
  @folio_cita VARCHAR(20),
  @nombre VARCHAR(100),
  @numero VARCHAR(20),
  @vencimiento VARCHAR(10),
  @cvv VARCHAR(5)
AS
BEGIN
  -- Asegúrate de que la cita se actualiza
  UPDATE CITA
  SET fk_id_citaEstatus = 2 -- Pago confirmado
  WHERE folio_cita = @folio_cita;
END;


