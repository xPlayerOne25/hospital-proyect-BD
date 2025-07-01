CREATE OR ALTER PROCEDURE sp_obtenerCobrosRecepcion
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        C.folio_cita,
        U.nombre + ' ' + U.apellido_paterno + ' ' + U.apellido_materno AS nombre_paciente,
        E.nombre_especialidad,
        C.cita_fechahora AS fecha_hora,
        E.costo_especialidad,

        -- Total servicios
        ISNULL(SUM(DISTINCT S.serv_costo * SV.cantidad), 0) AS total_servicios,

        -- Total medicamentos
        ISNULL(SUM(DISTINCT M.med_costo * MV.cantidad), 0) AS total_medicamentos,

        -- Total general
        E.costo_especialidad 
        + ISNULL(SUM(DISTINCT S.serv_costo * SV.cantidad), 0)
        + ISNULL(SUM(DISTINCT M.med_costo * MV.cantidad), 0) AS total

    FROM CITA C
    INNER JOIN PACIENTE P ON P.CURP = C.fk_cita_CURP
    INNER JOIN USUARIO U ON U.id_usuario = P.fk_pac_id_usuario
    INNER JOIN DOCTOR D ON D.cedula = C.fk_cedula
    INNER JOIN ESPECIALIDAD E ON E.id_especialidad = D.id_especialidad
    LEFT JOIN SERVICIO_VENDIDO SV ON SV.fk_folio_cita = C.folio_cita
    LEFT JOIN SERVICIO S ON S.id_servicio = SV.fk_id_servicio
    LEFT JOIN MEDICAMENTO_VENDIDO MV ON MV.fk_folio_cita = C.folio_cita
    LEFT JOIN MEDICAMENTO M ON M.id_medicamento = MV.fk_id_medicamento
    WHERE C.fk_id_citaEstatus = 4 -- Solo citas pagadas
    GROUP BY 
        C.folio_cita, 
        U.nombre, U.apellido_paterno, U.apellido_materno,
        E.nombre_especialidad,
        C.cita_fechahora,
        E.costo_especialidad
    ORDER BY C.cita_fechahora DESC;
END;

SELECT * FROM MEDICAMENTO
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%ESTATUS%'
