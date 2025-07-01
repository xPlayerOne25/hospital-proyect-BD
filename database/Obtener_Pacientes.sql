IF OBJECT_ID('sp_obtenerPacientes', 'P') IS NOT NULL
    DROP PROCEDURE sp_obtenerPacientes;
GO

CREATE PROCEDURE sp_obtenerPacientes
AS
BEGIN
    SELECT 
        p.CURP,
        p.pac_nombre AS nombre,
        p.pac_paterno AS apellido_paterno,
        p.pac_materno AS apellido_materno,
        p.pac_tel AS telefono,
        p.pac_fechaNacimiento AS fecha_nacimiento
    FROM PACIENTE p
    ORDER BY p.pac_paterno, p.pac_materno, p.pac_nombre;
END;
GO
