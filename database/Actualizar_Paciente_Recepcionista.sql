--ACTUALIZA LOS DATOS DEL PACIENTE DESDE EL DASHBOARD DEL RECEPCIONISTA



IF OBJECT_ID('sp_actualizarPaciente', 'P') IS NOT NULL
    DROP PROCEDURE sp_actualizarPaciente;
GO

CREATE PROCEDURE sp_actualizarPaciente
    @curp VARCHAR(18),
    @nombre VARCHAR(50),
    @paterno VARCHAR(50),
    @materno VARCHAR(50),
    @telefono VARCHAR(20),
    @fechaNacimiento DATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE PACIENTE
    SET 
        pac_nombre = @nombre,
        pac_paterno = @paterno,
        pac_materno = @materno,
        pac_tel = @telefono,
        pac_fechaNacimiento = @fechaNacimiento
    WHERE CURP = @curp;
END;
GO
