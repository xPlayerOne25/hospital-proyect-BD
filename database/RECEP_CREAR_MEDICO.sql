-- ===============================
-- STORED PROCEDURE COMPLETO: CREAR DOCTOR CON USUARIO
-- ===============================

CREATE OR ALTER PROCEDURE sp_crearDoctorCompleto
    @cedula VARCHAR(20),
    @empleado_nombre VARCHAR(50),
    @empleado_paterno VARCHAR(50),
    @empleado_materno VARCHAR(50) = NULL,
    @empleado_tel VARCHAR(15),
    @empleado_correo VARCHAR(100),
    @empleado_curp VARCHAR(18) = NULL,
    @especialidad_id INT,
    @consultorio_id INT = NULL,
    @horario_inicio TIME = '08:00',
    @horario_fin TIME = '17:00',
    @horario_turno BIT = 1,
    @sueldo DECIMAL(10,2) = 15000.00,
    @calle VARCHAR(100) = 'Sin especificar',
    @numero VARCHAR(10) = '0',
    @colonia VARCHAR(100) = 'Sin especificar',
    @codigo_postal VARCHAR(10) = '00000',
    @crear_usuario BIT = 1,
    @username VARCHAR(50) = NULL,
    @password_temp VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        PRINT '🩺 === INICIANDO CREACIÓN DE DOCTOR COMPLETO ===';
        PRINT 'Cédula: ' + @cedula;
        PRINT 'Nombre: ' + @empleado_nombre + ' ' + @empleado_paterno;
        PRINT 'Crear usuario: ' + CASE WHEN @crear_usuario = 1 THEN 'SÍ' ELSE 'NO' END;
        
        -- ================================
        -- VALIDACIONES INICIALES
        -- ================================
        
        -- Verificar que no exista un médico con la misma cédula
        IF EXISTS (SELECT 1 FROM MEDICO WHERE cedula = @cedula)
        BEGIN
            RAISERROR('❌ Ya existe un médico con la cédula %s', 16, 1, @cedula);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar que la especialidad existe
        IF NOT EXISTS (SELECT 1 FROM ESPECIALIDAD WHERE id_especialidad = @especialidad_id)
        BEGIN
            RAISERROR('❌ La especialidad con ID %d no existe', 16, 1, @especialidad_id);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar consultorio si se especifica
        IF @consultorio_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CONSULTORIO WHERE id_consultorio = @consultorio_id)
        BEGIN
            RAISERROR('❌ El consultorio con ID %d no existe', 16, 1, @consultorio_id);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar que no exista un usuario con el mismo correo (si se va a crear usuario)
        IF @crear_usuario = 1 AND EXISTS (SELECT 1 FROM USUARIO WHERE usuario_correo = @empleado_correo)
        BEGIN
            RAISERROR('❌ Ya existe un usuario con el correo %s', 16, 1, @empleado_correo);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- ================================
        -- 1. CREAR DIRECCIÓN
        -- ================================
        PRINT '🏠 Creando dirección...';
        
        DECLARE @id_direccion INT;
        INSERT INTO DIRECCION (calle, numero, colonia, codigoPostal)
        VALUES (@calle, @numero, @colonia, @codigo_postal);
        
        SET @id_direccion = SCOPE_IDENTITY();
        PRINT '✅ Dirección creada con ID: ' + CAST(@id_direccion AS VARCHAR);
        
        -- ================================
        -- 2. CREAR HORARIO
        -- ================================
        PRINT '⏰ Creando horario...';
        
        DECLARE @id_horario INT;
        INSERT INTO HORARIO (horario_inicio, horario_fin, horario_turno)
        VALUES (@horario_inicio, @horario_fin, @horario_turno);
        
        SET @id_horario = SCOPE_IDENTITY();
        PRINT '✅ Horario creado con ID: ' + CAST(@id_horario AS VARCHAR);
        PRINT 'Turno: ' + CASE WHEN @horario_turno = 1 THEN 'Matutino' ELSE 'Vespertino' END;
        PRINT 'Horario: ' + CAST(@horario_inicio AS VARCHAR) + ' - ' + CAST(@horario_fin AS VARCHAR);
        
        -- ================================
        -- 3. CREAR USUARIO (SI SE REQUIERE)
        -- ================================
        DECLARE @id_usuario INT = NULL;
        DECLARE @username_final VARCHAR(50) = NULL;
        DECLARE @password_final VARCHAR(50) = NULL;
        
        IF @crear_usuario = 1
        BEGIN
            PRINT '🔐 Creando usuario...';
            
            -- Generar username si no se proporciona
            IF @username IS NULL
            BEGIN
                SET @username = 'dr.' + LOWER(@empleado_nombre) + '.' + LOWER(@empleado_paterno);
                -- Limpiar caracteres especiales
                SET @username = REPLACE(REPLACE(REPLACE(@username, ' ', ''), 'ñ', 'n'), 'á', 'a');
                SET @username = REPLACE(REPLACE(REPLACE(@username, 'é', 'e'), 'í', 'i'), 'ó', 'o');
                SET @username = REPLACE(REPLACE(@username, 'ú', 'u'), 'ü', 'u');
                IF LEN(@username) > 50 SET @username = LEFT(@username, 50);
            END
            
            -- Generar password si no se proporciona
            IF @password_temp IS NULL
            BEGIN
                SET @password_temp = 'Doctor' + RIGHT(@cedula, 4) + '!';
            END
            
            -- Hacer username único
            SET @username_final = @username;
            DECLARE @contador INT = 1;
            
            WHILE EXISTS (SELECT 1 FROM USUARIO WHERE usuario_nombre = @username_final)
            BEGIN
                SET @username_final = LEFT(@username, 45) + CAST(@contador AS VARCHAR);
                SET @contador = @contador + 1;
                IF @contador > 999
                BEGIN
                    SET @username_final = 'dr' + CAST(ABS(CHECKSUM(NEWID())) % 100000 AS VARCHAR);
                    BREAK;
                END
            END
            
            SET @password_final = @password_temp;
            
            PRINT 'Username: ' + @username_final;
            PRINT 'Password temporal: ' + @password_final;
            
            -- Crear usuario
            INSERT INTO USUARIO (
                fk_id_tipoUsuario,
                contrasena,
                usuario_nombre,
                usuario_correo
            )
            VALUES (
                2, -- ID para Medico
                CONVERT(VARBINARY(255), @password_final),
                @username_final,
                @empleado_correo
            );
            
            SET @id_usuario = SCOPE_IDENTITY();
            PRINT '✅ Usuario creado con ID: ' + CAST(@id_usuario AS VARCHAR);
        END
        ELSE
        BEGIN
            PRINT '⚠️ No se creará usuario para este doctor';
        END
        
        -- ================================
        -- 4. CREAR EMPLEADO
        -- ================================
        PRINT '👤 Creando empleado...';
        
        DECLARE @id_empleado INT;
        INSERT INTO EMPLEADO (
            fk_empleado_id_direccion,
            fk_id_horario,
            fk_id_empleadoEstatus,
            fk_empleado_id_usuario,
            empleado_CURP,
            empleado_nombre,
            empleado_paterno,
            empleado_materno,
            empleado_tel,
            empleado_correo,
            empleado_sueldo
        )
        VALUES (
            @id_direccion,
            @id_horario,
            1, -- ID 1 = Activo
            @id_usuario, -- NULL si no se crea usuario
            @empleado_curp,
            @empleado_nombre,
            @empleado_paterno,
            @empleado_materno,
            @empleado_tel,
            @empleado_correo,
            @sueldo
        );
        
        SET @id_empleado = SCOPE_IDENTITY();
        PRINT '✅ Empleado creado con ID: ' + CAST(@id_empleado AS VARCHAR);
        
        -- ================================
        -- 5. CREAR MÉDICO
        -- ================================
        PRINT '🩺 Creando médico...';
        
        INSERT INTO MEDICO (
            cedula,
            fk_med_id_empleado,
            fk_id_especialidad,
            fk_id_consultorio,
            id_estatus
        )
        VALUES (
            @cedula,
            @id_empleado,
            @especialidad_id,
            @consultorio_id,
            1 -- Activo
        );
        
        PRINT '✅ Médico creado exitosamente';
        
        COMMIT TRANSACTION;
        
        -- ================================
        -- DEVOLVER INFORMACIÓN DE RESULTADO
        -- ================================
        SELECT 
            '✅ Doctor y usuario creados exitosamente' as mensaje,
            @cedula as cedula,
            @empleado_nombre + ' ' + @empleado_paterno + 
                CASE WHEN @empleado_materno IS NOT NULL 
                     THEN ' ' + @empleado_materno 
                     ELSE '' END as nombre_completo,
            @username_final as username,
            @password_final as password_temporal,
            @empleado_correo as email,
            (SELECT nombre_especialidad FROM ESPECIALIDAD WHERE id_especialidad = @especialidad_id) as especialidad,
            CASE WHEN @consultorio_id IS NOT NULL 
                 THEN (SELECT consultorio_numero FROM CONSULTORIO WHERE id_consultorio = @consultorio_id)
                 ELSE NULL END as consultorio,
            CASE WHEN @crear_usuario = 1 
                 THEN 'SÍ' 
                 ELSE 'NO' END as tiene_usuario,
            '⚠️ IMPORTANTE: El doctor debe cambiar la contraseña en el primer login' as nota_importante;
        
        PRINT '🎉 === PROCESO COMPLETADO EXITOSAMENTE ===';
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorLine INT = ERROR_LINE();
        
        PRINT '❌ === ERROR EN CREACIÓN DE DOCTOR ===';
        PRINT 'Línea: ' + CAST(@ErrorLine AS VARCHAR);
        PRINT 'Error: ' + @ErrorMessage;
        
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;

-- ===============================
-- SP PARA OBTENER MÉDICOS CON INFO COMPLETA
-- ===============================

CREATE OR ALTER PROCEDURE sp_obtenerMedicosCompletos
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.cedula,
        emp.empleado_nombre,
        emp.empleado_paterno,
        emp.empleado_materno,
        emp.empleado_tel,
        emp.empleado_correo,
        emp.empleado_CURP,
        emp.empleado_sueldo,
        e.id_especialidad,
        e.nombre_especialidad,
        e.costo_especialidad,
        con.id_consultorio,
        con.consultorio_numero,
        h.horario_inicio,
        h.horario_fin,
        CASE WHEN h.horario_turno = 1 THEN 'Matutino' ELSE 'Vespertino' END as turno,
        est.empleado_Estatus AS estatus,
        
        -- Información del usuario
        u.usuario_nombre as username,
        u.fk_id_tipoUsuario as tipo_usuario_id,
        tu.tipo_usuarioNombre as tipo_usuario,
        CASE WHEN u.id_usuario IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_acceso_sistema,
        
        -- Información de dirección
        d.calle,
        d.numero,
        d.colonia,
        d.codigoPostal,
        
        -- Estadísticas básicas
        (SELECT COUNT(*) FROM CITA WHERE fk_cedula = m.cedula) AS total_citas,
        
        -- IDs para referencias
        emp.id_empleado,
        m.id_estatus as medico_estatus
        
    FROM MEDICO m
    INNER JOIN EMPLEADO emp ON m.fk_med_id_empleado = emp.id_empleado
    INNER JOIN ESPECIALIDAD e ON m.fk_id_especialidad = e.id_especialidad
    LEFT JOIN CONSULTORIO con ON m.fk_id_consultorio = con.id_consultorio
    LEFT JOIN HORARIO h ON emp.fk_id_horario = h.id_horario
    LEFT JOIN EMPLEADO_ESTATUS est ON emp.fk_id_empleadoEstatus = est.id_empleadoEstatus
    LEFT JOIN DIRECCION d ON emp.fk_empleado_id_direccion = d.id_direccion
    LEFT JOIN USUARIO u ON emp.fk_empleado_id_usuario = u.id_usuario
    LEFT JOIN TIPO_USUARIO tu ON u.fk_id_tipoUsuario = tu.id_tipoUsuario
    
    WHERE (est.empleado_Estatus = 'Activo' OR est.empleado_Estatus IS NULL)
    ORDER BY emp.empleado_nombre, emp.empleado_paterno;
END;