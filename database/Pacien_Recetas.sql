CREATE OR ALTER PROCEDURE sp_getRecetasPaciente
  @curp_paciente VARCHAR(18)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT 
    r.id_receta,
    r.fk_folio_cita,
    r.tratamiento,
    r.diagnostico,
    r.medicamento,
    c.cita_fechahora AS fecha_emision,

    -- Datos del médico
    emp.empleado_nombre + ' ' + emp.empleado_paterno AS nombre_medico,
    e.nombre_especialidad

  FROM RECETA r
  INNER JOIN CITA c ON r.fk_folio_cita = c.folio_cita
  INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
  INNER JOIN EMPLEADO emp ON m.fk_med_id_empleado = emp.id_empleado
  INNER JOIN ESPECIALIDAD e ON m.fk_id_especialidad = e.id_especialidad
  WHERE c.fk_cita_CURP = @curp_paciente
  ORDER BY c.cita_fechahora DESC;
END;


SELECT * FROM RECETA