IF OBJECT_ID('sp_getPerfilPaciente', 'P') IS NOT NULL
    DROP PROCEDURE sp_getPerfilPaciente;
GO

CREATE PROCEDURE sp_getPerfilPaciente
    @curp VARCHAR(18)
AS
BEGIN
    SELECT 
        p.CURP,
        u.usuario_correo,
        u.usuario_nombre,
        p.pac_nombre,
        p.pac_paterno,
        p.pac_materno,
        p.pac_tel,
        p.pac_fechaNacimiento,
        p.pac_edad,
        d.calle,
        d.numero,
        d.colonia,
        d.codigoPostal
    FROM PACIENTE p
    INNER JOIN DIRECCION d ON p.fk_pac_id_direccion = d.id_direccion
    INNER JOIN USUARIO u ON p.fk_pac_id_usuario = u.id_usuario
    WHERE p.CURP = @curp;
END;
GO
