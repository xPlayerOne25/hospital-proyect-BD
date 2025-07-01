-- PASO 2: CREAR TABLA BITACORA
PRINT '📋 Creando tabla BITACORA...'

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BITACORA')
    DROP TABLE BITACORA

CREATE TABLE BITACORA (
    id_bitacora INT IDENTITY(1,1) PRIMARY KEY,
    fecha_movimiento DATETIME NOT NULL DEFAULT GETDATE(),
    tipo_movimiento VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    tabla_afectada VARCHAR(50) NOT NULL,  -- CITA, MEDICO, PACIENTE, RECETA
    descripcion VARCHAR(500) NOT NULL,
    usuario_responsable VARCHAR(100) NULL, -- Nombre del médico/recepcionista
    paciente_id VARCHAR(18) NULL,         -- CURP del paciente
    paciente_nombre VARCHAR(200) NULL,    -- Nombre completo del paciente
    medico_cedula VARCHAR(20) NULL,       -- Cédula del médico
    medico_nombre VARCHAR(200) NULL,      -- Nombre completo del médico
    especialidad VARCHAR(100) NULL,       -- Especialidad médica
    consultorio VARCHAR(20) NULL,         -- Número de consultorio
    folio_cita INT NULL,                  -- Folio de cita relacionada
    id_receta INT NULL,                   -- ID de receta relacionada
    diagnostico VARCHAR(500) NULL,        -- Diagnóstico médico
    detalles_adicionales TEXT NULL,       -- Información adicional
    ip_usuario VARCHAR(50) NULL,          -- IP del usuario (opcional)
    fecha_creacion DATETIME DEFAULT GETDATE()
);



-- PASO 3: TRIGGER INSERT CITA
CREATE TRIGGER TR_InsertCita_Bitacora
ON CITA
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @folio_cita INT;
    DECLARE @paciente_curp VARCHAR(18);
    DECLARE @medico_cedula VARCHAR(20);
    DECLARE @estatus_id INT;
    DECLARE @fecha_cita DATETIME;
    DECLARE @pago_id INT;
    
    -- Variables para nombres
    DECLARE @paciente_nombre VARCHAR(200);
    DECLARE @medico_nombre VARCHAR(200);
    DECLARE @especialidad VARCHAR(100);
    DECLARE @consultorio VARCHAR(50);
    DECLARE @estatus_desc VARCHAR(100);
    
    -- Obtener datos de la cita insertada
    SELECT 
        @folio_cita = folio_cita,
        @paciente_curp = fk_cita_CURP,
        @medico_cedula = fk_cedula,
        @estatus_id = fk_id_citaEstatus,
        @fecha_cita = cita_fechahora,
        @pago_id = id_pago
    FROM inserted;
    
    -- Obtener nombre del paciente
    SELECT @paciente_nombre = pac_nombre + ' ' + pac_paterno + 
           CASE WHEN pac_materno IS NOT NULL THEN ' ' + pac_materno ELSE '' END
    FROM PACIENTE 
    WHERE CURP = @paciente_curp;
    
    -- Obtener información del médico
    SELECT 
        @medico_nombre = emp.empleado_nombre + ' ' + emp.empleado_paterno +
                        CASE WHEN emp.empleado_materno IS NOT NULL THEN ' ' + emp.empleado_materno ELSE '' END,
        @especialidad = esp.nombre_especialidad
    FROM MEDICO m
    INNER JOIN EMPLEADO emp ON m.fk_med_id_empleado = emp.id_empleado
    LEFT JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
    WHERE m.cedula = @medico_cedula;
    
    -- Obtener consultorio
    SELECT @consultorio = 'Consultorio ' + CAST(con.consultorio_numero AS VARCHAR)
    FROM MEDICO m
    LEFT JOIN CONSULTORIO con ON m.fk_id_consultorio = con.id_consultorio
    WHERE m.cedula = @medico_cedula;
    
    -- Obtener estatus
    SELECT @estatus_desc = estatusCita
    FROM CITA_ESTATUS 
    WHERE id_citaEstatus = @estatus_id;
    
    -- Insertar en bitácora
    INSERT INTO BITACORA (
        tipo_movimiento,
        tabla_afectada,
        descripcion,
        usuario_responsable,
        paciente_id,
        paciente_nombre,
        medico_cedula,
        medico_nombre,
        especialidad,
        consultorio,
        folio_cita,
        detalles_adicionales
    )
    VALUES (
        'INSERT',
        'CITA',
        'Nueva cita programada - ' + ISNULL(@estatus_desc, 'Sin estatus'),
        ISNULL(@medico_nombre, 'Sistema'),
        @paciente_curp,
        ISNULL(@paciente_nombre, 'Paciente no identificado'),
        @medico_cedula,
        ISNULL(@medico_nombre, 'Médico no identificado'),
        ISNULL(@especialidad, 'Sin especialidad'),
        ISNULL(@consultorio, 'Sin consultorio'),
        @folio_cita,
        'Fecha y hora: ' + CAST(@fecha_cita AS VARCHAR) + 
        ' | Pago: $' + CAST(ISNULL(@pago_id, 0) AS VARCHAR)
    );
    
    PRINT '📝 Bitácora: Nueva cita registrada - Folio: ' + CAST(@folio_cita AS VARCHAR);
END


----------------------------------------------------------------------------------------------------

-- PASO 4: TRIGGER UPDATE CITA
CREATE TRIGGER TR_UpdateCita_Bitacora
ON CITA
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Solo registrar cambios de estatus
    IF UPDATE(fk_id_citaEstatus)
    BEGIN
        DECLARE @folio_cita INT;
        DECLARE @paciente_curp VARCHAR(18);
        DECLARE @medico_cedula VARCHAR(20);
        DECLARE @estatus_old_id INT;
        DECLARE @estatus_new_id INT;
        DECLARE @fecha_cita DATETIME;
        
        -- Variables para nombres
        DECLARE @paciente_nombre VARCHAR(200);
        DECLARE @medico_nombre VARCHAR(200);
        DECLARE @especialidad VARCHAR(100);
        DECLARE @consultorio VARCHAR(50);
        DECLARE @estatus_old VARCHAR(100);
        DECLARE @estatus_new VARCHAR(100);
        
        -- Obtener datos de la cita actualizada
        SELECT 
            @folio_cita = folio_cita,
            @paciente_curp = fk_cita_CURP,
            @medico_cedula = fk_cedula,
            @estatus_new_id = fk_id_citaEstatus,
            @fecha_cita = cita_fechahora
        FROM inserted;
        
        -- Obtener estatus anterior
        SELECT @estatus_old_id = fk_id_citaEstatus
        FROM deleted;
        
        -- Obtener nombre del paciente
        SELECT @paciente_nombre = pac_nombre + ' ' + pac_paterno + 
               CASE WHEN pac_materno IS NOT NULL THEN ' ' + pac_materno ELSE '' END
        FROM PACIENTE 
        WHERE CURP = @paciente_curp;
        
        -- Obtener información del médico
        SELECT 
            @medico_nombre = emp.empleado_nombre + ' ' + emp.empleado_paterno +
                            CASE WHEN emp.empleado_materno IS NOT NULL THEN ' ' + emp.empleado_materno ELSE '' END,
            @especialidad = esp.nombre_especialidad
        FROM MEDICO m
        INNER JOIN EMPLEADO emp ON m.fk_med_id_empleado = emp.id_empleado
        LEFT JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
        WHERE m.cedula = @medico_cedula;
        
        -- Obtener consultorio
        SELECT @consultorio = 'Consultorio ' + CAST(con.consultorio_numero AS VARCHAR)
        FROM MEDICO m
        LEFT JOIN CONSULTORIO con ON m.fk_id_consultorio = con.id_consultorio
        WHERE m.cedula = @medico_cedula;
        
        -- Obtener nombres de estatus
        SELECT @estatus_old = estatusCita
        FROM CITA_ESTATUS 
        WHERE id_citaEstatus = @estatus_old_id;
        
        SELECT @estatus_new = estatusCita
        FROM CITA_ESTATUS 
        WHERE id_citaEstatus = @estatus_new_id;
        
        -- Insertar en bitácora
        INSERT INTO BITACORA (
            tipo_movimiento,
            tabla_afectada,
            descripcion,
            usuario_responsable,
            paciente_id,
            paciente_nombre,
            medico_cedula,
            medico_nombre,
            especialidad,
            consultorio,
            folio_cita,
            detalles_adicionales
        )
        VALUES (
            'UPDATE',
            'CITA',
            'Cambio de estatus: ' + ISNULL(@estatus_old, 'Sin estatus') + 
            ' → ' + ISNULL(@estatus_new, 'Sin estatus'),
            ISNULL(@medico_nombre, 'Sistema'),
            @paciente_curp,
            ISNULL(@paciente_nombre, 'Paciente no identificado'),
            @medico_cedula,
            ISNULL(@medico_nombre, 'Médico no identificado'),
            ISNULL(@especialidad, 'Sin especialidad'),
            ISNULL(@consultorio, 'Sin consultorio'),
            @folio_cita,
            'Fecha: ' + CAST(@fecha_cita AS VARCHAR) + 
            ' | Cambio realizado: ' + CAST(GETDATE() AS VARCHAR)
        );
        
        PRINT '📝 Bitácora: Estatus de cita actualizado - Folio: ' + CAST(@folio_cita AS VARCHAR);
    END
END

----------------------------------------------------------------------------------------------------

-- PASO 5: TRIGGER DELETE CITA
CREATE TRIGGER TR_DeleteCita_Bitacora
ON CITA
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @folio_cita INT;
    DECLARE @paciente_curp VARCHAR(18);
    DECLARE @medico_cedula VARCHAR(20);
    DECLARE @estatus_id INT;
    DECLARE @fecha_cita DATETIME;
    
    -- Variables para nombres
    DECLARE @paciente_nombre VARCHAR(200);
    DECLARE @medico_nombre VARCHAR(200);
    DECLARE @especialidad VARCHAR(100);
    DECLARE @consultorio VARCHAR(50);
    DECLARE @estatus_desc VARCHAR(100);
    
    -- Obtener datos de la cita eliminada
    SELECT 
        @folio_cita = folio_cita,
        @paciente_curp = fk_cita_CURP,
        @medico_cedula = fk_cedula,
        @estatus_id = fk_id_citaEstatus,
        @fecha_cita = cita_fechahora
    FROM deleted;
    
    -- Obtener nombre del paciente
    SELECT @paciente_nombre = pac_nombre + ' ' + pac_paterno + 
           CASE WHEN pac_materno IS NOT NULL THEN ' ' + pac_materno ELSE '' END
    FROM PACIENTE 
    WHERE CURP = @paciente_curp;
    
    -- Obtener información del médico
    SELECT 
        @medico_nombre = emp.empleado_nombre + ' ' + emp.empleado_paterno +
                        CASE WHEN emp.empleado_materno IS NOT NULL THEN ' ' + emp.empleado_materno ELSE '' END,
        @especialidad = esp.nombre_especialidad
    FROM MEDICO m
    INNER JOIN EMPLEADO emp ON m.fk_med_id_empleado = emp.id_empleado
    LEFT JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
    WHERE m.cedula = @medico_cedula;
    
    -- Obtener consultorio
    SELECT @consultorio = 'Consultorio ' + CAST(con.consultorio_numero AS VARCHAR)
    FROM MEDICO m
    LEFT JOIN CONSULTORIO con ON m.fk_id_consultorio = con.id_consultorio
    WHERE m.cedula = @medico_cedula;
    
    -- Obtener estatus
    SELECT @estatus_desc = estatusCita
    FROM CITA_ESTATUS 
    WHERE id_citaEstatus = @estatus_id;
    
    -- Insertar en bitácora
    INSERT INTO BITACORA (
        tipo_movimiento,
        tabla_afectada,
        descripcion,
        usuario_responsable,
        paciente_id,
        paciente_nombre,
        medico_cedula,
        medico_nombre,
        especialidad,
        consultorio,
        folio_cita,
        detalles_adicionales
    )
    VALUES (
        'DELETE',
        'CITA',
        'Cita eliminada - ' + ISNULL(@estatus_desc, 'Sin estatus'),
        ISNULL(@medico_nombre, 'Sistema'),
        @paciente_curp,
        ISNULL(@paciente_nombre, 'Paciente no identificado'),
        @medico_cedula,
        ISNULL(@medico_nombre, 'Médico no identificado'),
        ISNULL(@especialidad, 'Sin especialidad'),
        ISNULL(@consultorio, 'Sin consultorio'),
        @folio_cita,
        'Fecha original: ' + CAST(@fecha_cita AS VARCHAR) + 
        ' | Eliminada: ' + CAST(GETDATE() AS VARCHAR)
    );
    
    PRINT '📝 Bitácora: Cita eliminada - Folio: ' + CAST(@folio_cita AS VARCHAR);
END

----------------------------------------------------------------------------------------------------

-- PASO 6: TRIGGER INSERT RECETA
CREATE TRIGGER TR_InsertReceta_Bitacora
ON RECETA
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id_receta INT;
    DECLARE @folio_cita INT;
    DECLARE @diagnostico VARCHAR(500);
    DECLARE @tratamiento VARCHAR(500);
    DECLARE @medicamento VARCHAR(500);
    
    -- Variables para información de cita
    DECLARE @paciente_curp VARCHAR(18);
    DECLARE @medico_cedula VARCHAR(20);
    DECLARE @paciente_nombre VARCHAR(200);
    DECLARE @medico_nombre VARCHAR(200);
    DECLARE @especialidad VARCHAR(100);
    
    -- Obtener datos de la receta insertada
    SELECT 
        @id_receta = id_receta,
        @folio_cita = fk_folio_cita,
        @diagnostico = diagnostico,
        @tratamiento = tratamiento,
        @medicamento = medicamento
    FROM inserted;
    
    -- Obtener información de la cita relacionada
    SELECT 
        @paciente_curp = fk_cita_CURP,
        @medico_cedula = fk_cedula
    FROM CITA 
    WHERE folio_cita = @folio_cita;
    
    -- Obtener nombre del paciente
    SELECT @paciente_nombre = pac_nombre + ' ' + pac_paterno + 
           CASE WHEN pac_materno IS NOT NULL THEN ' ' + pac_materno ELSE '' END
    FROM PACIENTE 
    WHERE CURP = @paciente_curp;
    
    -- Obtener información del médico
    SELECT 
        @medico_nombre = emp.empleado_nombre + ' ' + emp.empleado_paterno +
                        CASE WHEN emp.empleado_materno IS NOT NULL THEN ' ' + emp.empleado_materno ELSE '' END,
        @especialidad = esp.nombre_especialidad
    FROM MEDICO m
    INNER JOIN EMPLEADO emp ON m.fk_med_id_empleado = emp.id_empleado
    LEFT JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
    WHERE m.cedula = @medico_cedula;
    
    -- Insertar en bitácora
    INSERT INTO BITACORA (
        tipo_movimiento,
        tabla_afectada,
        descripcion,
        usuario_responsable,
        paciente_id,
        paciente_nombre,
        medico_cedula,
        medico_nombre,
        especialidad,
        folio_cita,
        id_receta,
        diagnostico,
        detalles_adicionales
    )
    VALUES (
        'INSERT',
        'RECETA',
        'Nueva receta generada',
        ISNULL(@medico_nombre, 'Médico no identificado'),
        @paciente_curp,
        ISNULL(@paciente_nombre, 'Paciente no identificado'),
        @medico_cedula,
        ISNULL(@medico_nombre, 'Médico no identificado'),
        ISNULL(@especialidad, 'Sin especialidad'),
        @folio_cita,
        @id_receta,
        ISNULL(@diagnostico, 'Sin diagnóstico especificado'),
        'Tratamiento: ' + ISNULL(@tratamiento, 'No especificado') + 
        ' | Medicamento: ' + ISNULL(@medicamento, 'No especificado')
    );
    
    PRINT '📝 Bitácora: Nueva receta registrada - ID: ' + CAST(@id_receta AS VARCHAR);
END

------------------------------------------------


-- PASO 7: STORED PROCEDURES PARA CONSULTAR BITÁCORA

-- SP 1: Obtener historial médico de un paciente
CREATE OR ALTER PROCEDURE sp_obtenerHistorialPaciente
    @paciente_curp VARCHAR(18)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.id_bitacora,
        b.fecha_movimiento,
        b.usuario_responsable AS medico_responsable,
        b.especialidad,
        b.paciente_nombre,
        b.diagnostico,
        b.consultorio,
        b.tipo_movimiento,
        b.descripcion,
        b.detalles_adicionales,
        b.folio_cita,
        b.id_receta
    FROM BITACORA b
    WHERE b.paciente_id = @paciente_curp
    ORDER BY b.fecha_movimiento DESC;
END

-- SP 2: Obtener movimientos por médico
CREATE OR ALTER PROCEDURE sp_obtenerMovimientosMedico
    @medico_cedula VARCHAR(20) = NULL,
    @medico_nombre VARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.id_bitacora,
        b.fecha_movimiento,
        b.tipo_movimiento,
        b.tabla_afectada,
        b.descripcion,
        b.paciente_nombre,
        b.paciente_id,
        b.especialidad,
        b.consultorio,
        b.folio_cita,
        b.id_receta,
        b.diagnostico
    FROM BITACORA b
    WHERE (@medico_cedula IS NULL OR b.medico_cedula = @medico_cedula)
      AND (@medico_nombre IS NULL OR b.medico_nombre LIKE '%' + @medico_nombre + '%')
    ORDER BY b.fecha_movimiento DESC;
END