IF OBJECT_ID('sp_obtenerMedicos', 'P') IS NOT NULL
    DROP PROCEDURE sp_obtenerMedicos;
GO

CREATE PROCEDURE sp_obtenerMedicos
AS
BEGIN
    SELECT 
        m.cedula,
        e.empleado_nombre,
        e.empleado_paterno,
        e.empleado_materno,
        e.empleado_tel,
        e.empleado_correo,
        esp.nombre_especialidad,
        esp.descripcion AS descripcion_especialidad,
        esp.costo_especialidad,
        c.consultorio_numero,
        h.horario_inicio,
        h.horario_fin,
        m.id_estatus
    FROM MEDICO m
    INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
    INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
    INNER JOIN CONSULTORIO c ON m.fk_id_consultorio = c.id_consultorio
    INNER JOIN HORARIO h ON c.fk_id_consultorioHorario = h.id_horario;
END;
GO
