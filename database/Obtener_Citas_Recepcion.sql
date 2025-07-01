ALTER PROCEDURE sp_obtenerCitasRecepcion
AS
BEGIN
    SELECT 
        C.folio_cita,
        C.cita_fechahora,
        
        -- DATOS DEL PACIENTE
        P.CURP AS curp_paciente,
        PU.usuario_nombre AS nombre_paciente,
        P.pac_paterno,
        P.pac_materno,
        P.pac_tel,

        -- DATOS DEL MÉDICO (ya filtrado desde la tabla MEDICO)
        EM.empleado_CURP AS curp_medico,
        CONCAT(EM.empleado_nombre, ' ', EM.empleado_paterno, ' ', EM.empleado_materno) AS nombre_doctor,
        E.nombre_especialidad,

        -- ESTATUS
        CE.estatusCita AS estatus,
        CE.descripcion AS descripcion_estatus

    FROM CITA C
    INNER JOIN PACIENTE P ON C.fk_cita_CURP = P.CURP
    INNER JOIN USUARIO PU ON P.fk_pac_id_usuario = PU.id_usuario

    -- Médico garantizado
    INNER JOIN MEDICO M ON C.fk_cedula = M.cedula
    INNER JOIN EMPLEADO EM ON M.fk_med_id_empleado = EM.id_empleado
    INNER JOIN ESPECIALIDAD E ON M.fk_id_especialidad = E.id_especialidad

    INNER JOIN CITA_ESTATUS CE ON C.fk_id_citaEstatus = CE.id_citaEstatus

    ORDER BY C.cita_fechahora DESC;
END
