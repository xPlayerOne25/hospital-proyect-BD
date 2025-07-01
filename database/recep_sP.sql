IF OBJECT_ID('sp_actualizarPerfilPaciente', 'P') IS NOT NULL
    DROP PROCEDURE sp_actualizarPerfilPaciente;
GO

CREATE PROCEDURE sp_actualizarPerfilPaciente
    @curp VARCHAR(18),
    @nombre VARCHAR(50),
    @paterno VARCHAR(50),
    @materno VARCHAR(50),
    @telefono VARCHAR(20),
    @fechaNacimiento DATE,
    @correo VARCHAR(100),
    @nombreUsuario VARCHAR(50)

AS
BEGIN
    SET NOCOUNT ON;

    -- Actualizar datos del paciente
    UPDATE PACIENTE
    SET 
        pac_nombre = @nombre,
        pac_paterno = @paterno,
        pac_materno = @materno,
        pac_tel = @telefono,
        pac_fechaNacimiento = @fechaNacimiento
    WHERE CURP = @curp;

    -- Actualizar correo en la tabla USUARIO usando la FK
    UPDATE USUARIO
    SET 
    usuario_correo = @correo,
    usuario_nombre = @nombreUsuario

    WHERE id_usuario = (
        SELECT fk_pac_id_usuario
        FROM PACIENTE
        WHERE CURP = @curp
    );
END;
GO
