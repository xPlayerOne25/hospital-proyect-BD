-- =====================================================
-- SISTEMA DE GESTIÓN HOSPITALARIA - BASE DE DATOS COMPLETA
-- =====================================================

-- Crear la base de datos
CREATE DATABASE HospitalDB;
GO

USE HospitalDB;
GO

-- =====================================================
-- CREAR TABLAS EN ORDEN CORRECTO (SIN DEPENDENCIAS PRIMERO)
-- =====================================================

-- 1. DIRECCION
CREATE TABLE DIRECCION (
    id_direccion INT IDENTITY(1,1) PRIMARY KEY,
    calle VARCHAR(50) NOT NULL,
    numero VARCHAR(10) NOT NULL,
    colonia VARCHAR(50) NOT NULL,
    codigoPostal VARCHAR(5) NOT NULL
);

-- 2. TIPO_USUARIO
CREATE TABLE TIPO_USUARIO (
    id_tipoUsuario INT IDENTITY(1,1) PRIMARY KEY,
    tipo_usuarioNombre VARCHAR(20) NOT NULL UNIQUE,
    tipo_usuarioDesc VARCHAR(100)
);

-- 3. USUARIO
CREATE TABLE USUARIO (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    fk_id_tipoUsuario INT NOT NULL,
    contrasena VARBINARY(255) NOT NULL,
    usuario_nombre VARCHAR(50) NOT NULL UNIQUE,
    usuario_correo VARCHAR(100) NOT NULL UNIQUE,
    FOREIGN KEY (fk_id_tipoUsuario) REFERENCES TIPO_USUARIO(id_tipoUsuario)
);

-- 4. EMPLEADO_ESTATUS
CREATE TABLE EMPLEADO_ESTATUS (
    id_empleadoEstatus INT IDENTITY(1,1) PRIMARY KEY,
    empleado_Estatus VARCHAR(25) NOT NULL UNIQUE
);

-- 5. HORARIO
CREATE TABLE HORARIO (
    id_horario INT IDENTITY(1,1) PRIMARY KEY,
    horario_turno BIT NOT NULL, -- 0 = Matutino, 1 = Vespertino
    horario_inicio TIME NOT NULL,
    horario_fin TIME NOT NULL
);

-- 6. EMPLEADO
CREATE TABLE EMPLEADO (
    id_empleado INT IDENTITY(1,1) PRIMARY KEY,
    fk_empleado_id_direccion INT NOT NULL,
    fk_id_horario INT NOT NULL,
    fk_id_empleadoEstatus INT NOT NULL,
    fk_empleado_id_usuario INT NOT NULL,
    empleado_CURP VARCHAR(18) NOT NULL UNIQUE,
    empleado_nombre VARCHAR(50) NOT NULL,
    empleado_paterno VARCHAR(50) NOT NULL,
    empleado_materno VARCHAR(50),
    empleado_tel VARCHAR(15) NOT NULL,
    empleado_correo VARCHAR(50) NOT NULL,
    empleado_sueldo MONEY NOT NULL,
    FOREIGN KEY (fk_empleado_id_direccion) REFERENCES DIRECCION(id_direccion),
    FOREIGN KEY (fk_id_horario) REFERENCES HORARIO(id_horario),
    FOREIGN KEY (fk_id_empleadoEstatus) REFERENCES EMPLEADO_ESTATUS(id_empleadoEstatus),
    FOREIGN KEY (fk_empleado_id_usuario) REFERENCES USUARIO(id_usuario)
);

-- 7. PACIENTE
CREATE TABLE PACIENTE (
    CURP VARCHAR(18) PRIMARY KEY,
    fk_pac_id_direccion INT NOT NULL,
    fk_pac_id_usuario INT NOT NULL,
    pac_nombre VARCHAR(50) NOT NULL,
    pac_paterno VARCHAR(50) NOT NULL,
    pac_materno VARCHAR(50),
    pac_fechaNacimiento DATE NOT NULL,
    pac_edad INT NOT NULL,
    pac_tel VARCHAR(15) NOT NULL,
    FOREIGN KEY (fk_pac_id_direccion) REFERENCES DIRECCION(id_direccion),
    FOREIGN KEY (fk_pac_id_usuario) REFERENCES USUARIO(id_usuario)
);

-- 8. ESPECIALIDAD
CREATE TABLE ESPECIALIDAD (
    id_especialidad INT IDENTITY(1,1) PRIMARY KEY,
    descripcion VARCHAR(100),
    nombre_especialidad VARCHAR(30) NOT NULL UNIQUE,
    costo_especialidad MONEY NOT NULL
);

-- 9. CONSULTORIO_HORARIO
CREATE TABLE CONSULTORIO_HORARIO (
    id_consultorioHorario INT IDENTITY(1,1) PRIMARY KEY,
    consultorio_turno INT NOT NULL, -- 1=Matutino, 2=Vespertino, 3=Nocturno
    consultorio_fechahorainicio DATETIME NOT NULL,
    consultorio_enUso BIT DEFAULT 0
);

-- 10. CONSULTORIO
CREATE TABLE CONSULTORIO (
    id_consultorio INT IDENTITY(1,1) PRIMARY KEY,
    fk_id_consultorioHorario INT NOT NULL,
    consultorio_numero INT NOT NULL UNIQUE,
    FOREIGN KEY (fk_id_consultorioHorario) REFERENCES CONSULTORIO_HORARIO(id_consultorioHorario)
);

-- 11. MEDICO
CREATE TABLE MEDICO (
    cedula VARCHAR(20) PRIMARY KEY,
    fk_med_id_empleado INT NOT NULL,
    fk_id_especialidad INT NOT NULL,
    fk_id_consultorio INT NOT NULL,
    FOREIGN KEY (fk_med_id_empleado) REFERENCES EMPLEADO(id_empleado),
    FOREIGN KEY (fk_id_especialidad) REFERENCES ESPECIALIDAD(id_especialidad),
    FOREIGN KEY (fk_id_consultorio) REFERENCES CONSULTORIO(id_consultorio)
);

-- 12. RECEPCION
CREATE TABLE RECEPCION (
    id_recepcion INT IDENTITY(1,1) PRIMARY KEY,
    fk_recepcion_id_empleado INT NOT NULL,
    FOREIGN KEY (fk_recepcion_id_empleado) REFERENCES EMPLEADO(id_empleado)
);

-- 13. FARMACEUTICO
CREATE TABLE FARMACEUTICO (
    id_farmaceutico INT IDENTITY(1,1) PRIMARY KEY,
    fk_farmaceutico_id_empleado INT NOT NULL,
    FOREIGN KEY (fk_farmaceutico_id_empleado) REFERENCES EMPLEADO(id_empleado)
);

-- 14. CITA_ESTATUS
CREATE TABLE CITA_ESTATUS (
    id_citaEstatus INT IDENTITY(1,1) PRIMARY KEY,
    estatusCita VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(100)
);

-- 15. PAGO_CITA
CREATE TABLE PAGO_CITA (
    id_pago INT IDENTITY(1,1) PRIMARY KEY,
    pago_cantidadTotal MONEY NOT NULL,
    pago_abonado MONEY NOT NULL DEFAULT 0,
    pago_fechaHora DATETIME NOT NULL DEFAULT GETDATE(),
    estatuspago BIT NOT NULL DEFAULT 0 -- 0 = Pendiente, 1 = Pagado
);

-- 16. CITA
CREATE TABLE CITA (
    folio_cita INT IDENTITY(1,1) PRIMARY KEY,
    fk_cita_CURP VARCHAR(18) NOT NULL,
    fk_cedula VARCHAR(20) NOT NULL,
    fk_id_citaEstatus INT NOT NULL,
    id_pago INT NOT NULL,
    cita_fechahora DATETIME NOT NULL,
    FOREIGN KEY (fk_cita_CURP) REFERENCES PACIENTE(CURP),
    FOREIGN KEY (fk_cedula) REFERENCES MEDICO(cedula),
    FOREIGN KEY (fk_id_citaEstatus) REFERENCES CITA_ESTATUS(id_citaEstatus),
    FOREIGN KEY (id_pago) REFERENCES PAGO_CITA(id_pago)
);

-- 17. RECETA
CREATE TABLE RECETA (
    id_receta INT IDENTITY(1,1) PRIMARY KEY,
    fk_folio_cita INT NOT NULL,
    tratamiento VARCHAR(100),
    diagnostico VARCHAR(100),
    medicamento VARCHAR(100),
    FOREIGN KEY (fk_folio_cita) REFERENCES CITA(folio_cita)
);

-- 18. HISTORIAL_MEDICO
CREATE TABLE HISTORIAL_MEDICO (
    id_historialMed INT IDENTITY(1,1) PRIMARY KEY,
    fk_historialmed_CURP VARCHAR(18) NOT NULL,
    FOREIGN KEY (fk_historialmed_CURP) REFERENCES PACIENTE(CURP)
);



-- 19. HISTORIAL_DETALLE
CREATE TABLE HISTORIAL_DETALLE (
    id_historialmeddetalle INT IDENTITY(1,1) PRIMARY KEY,
    fk_id_historialMed INT NOT NULL,
    historialMed_fechhora DATETIME NOT NULL DEFAULT GETDATE(),
    motivo_consulta VARCHAR(100),
    examen_fisico VARCHAR(100),
    diagnostico VARCHAR(100),
    FOREIGN KEY (fk_id_historialMed) REFERENCES HISTORIAL_MEDICO(id_historialMed)
);

-- Agregar campos faltantes a HISTORIAL_DETALLE
ALTER TABLE HISTORIAL_DETALLE ADD tipo_sangre VARCHAR(5);
ALTER TABLE HISTORIAL_DETALLE ADD alergias VARCHAR(200);
ALTER TABLE HISTORIAL_DETALLE ADD padecimientos_previos VARCHAR(200);
ALTER TABLE HISTORIAL_DETALLE ADD peso DECIMAL(5,2);
ALTER TABLE HISTORIAL_DETALLE ADD estatura DECIMAL(3,2);

ALTER TABLE HISTORIAL_DETALLE ADD cedula_medico VARCHAR(20);
ALTER TABLE HISTORIAL_DETALLE ADD CONSTRAINT FK_HISTORIAL_MEDICO 
    FOREIGN KEY (cedula_medico) REFERENCES MEDICO(cedula);

-- 20. SERVICIO
CREATE TABLE SERVICIO (
    id_servicio INT IDENTITY(1,1) PRIMARY KEY,
    serv_costo MONEY NOT NULL,
    serv_descripcion VARCHAR(200),
    serv_nombre VARCHAR(40) NOT NULL UNIQUE
);

-- 21. MEDICAMENTO
CREATE TABLE MEDICAMENTO (
    id_medicamento INT IDENTITY(1,1) PRIMARY KEY,
    med_nombre VARCHAR(50) NOT NULL UNIQUE,
    med_stock INT NOT NULL DEFAULT 0,
    med_costo MONEY NOT NULL
);

-- 22. VENTA
CREATE TABLE VENTA (
    id_venta INT IDENTITY(1,1) PRIMARY KEY,
    fk_id_farmaceutico INT NOT NULL,
    venta_fechahora DATETIME NOT NULL DEFAULT GETDATE(),
    totalPago MONEY NOT NULL,
    FOREIGN KEY (fk_id_farmaceutico) REFERENCES FARMACEUTICO(id_farmaceutico)
);

-- 23. VENTA_DETALLE
CREATE TABLE VENTA_DETALLE (
    id_ventaDetalle INT IDENTITY(1,1) PRIMARY KEY,
    fk_id_medicamento INT,
    fk_id_servicio INT,
    fk_id_venta INT NOT NULL,
    cantidadMedicamento INT DEFAULT 0,
    cantidadServicios INT DEFAULT 0,
    FOREIGN KEY (fk_id_medicamento) REFERENCES MEDICAMENTO(id_medicamento),
    FOREIGN KEY (fk_id_servicio) REFERENCES SERVICIO(id_servicio),
    FOREIGN KEY (fk_id_venta) REFERENCES VENTA(id_venta)
);

--SERVICIO_VENDIDO
CREATE TABLE SERVICIO_VENDIDO (
  id_servicio_vendido INT IDENTITY(1,1) PRIMARY KEY,
  fk_folio_cita INT NOT NULL,
  fk_id_servicio INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  FOREIGN KEY (fk_folio_cita) REFERENCES CITA(folio_cita),
  FOREIGN KEY (fk_id_servicio) REFERENCES SERVICIO(id_servicio)
);


-- =====================================================
-- INSERTAR DATOS DE PRUEBA (10 REGISTROS POR TABLA)
-- =====================================================

-- DIRECCIONES
INSERT INTO DIRECCION (calle, numero, colonia, codigoPostal) VALUES
('Av. Insurgentes', '123', 'Centro', '06000'),
('Calle Reforma', '456', 'Juárez', '06600'),
('Blvd. Miguel Hidalgo', '789', 'Doctores', '06720'),
('Av. Universidad', '321', 'Del Valle', '03100'),
('Calle Madero', '654', 'Tabacalera', '06030'),
('Av. Chapultepec', '987', 'Roma Norte', '06700'),
('Calle Puebla', '159', 'Roma Sur', '06760'),
('Av. Cuauhtémoc', '753', 'Narvarte', '03020'),
('Calle Durango', '852', 'Condesa', '06140'),
('Av. Revolución', '741', 'San Ángel', '01000');

-- TIPOS DE USUARIO
INSERT INTO TIPO_USUARIO (tipo_usuarioNombre, tipo_usuarioDesc) VALUES
('Paciente', 'Usuario paciente del hospital'),
('Medico', 'Médico especialista'),
('Recepcionista', 'Personal de recepción'),
('Farmaceutico', 'Farmacéutico del hospital'),
('Administrador', 'Administrador del sistema');

-- USUARIOS (contraseña: "123456" encriptada)
INSERT INTO USUARIO (fk_id_tipoUsuario, contrasena, usuario_nombre, usuario_correo) VALUES
(1, HASHBYTES('SHA2_256', '123456'), 'juan.perez', 'juan.perez@email.com'),
(1, HASHBYTES('SHA2_256', '123456'), 'maria.garcia', 'maria.garcia@email.com'),
(1, HASHBYTES('SHA2_256', '123456'), 'carlos.lopez', 'carlos.lopez@email.com'),
(1, HASHBYTES('SHA2_256', '123456'), 'ana.martinez', 'ana.martinez@email.com'),
(1, HASHBYTES('SHA2_256', '123456'), 'luis.rodriguez', 'luis.rodriguez@email.com'),
(2, HASHBYTES('SHA2_256', '123456'), 'dr.gonzalez', 'dr.gonzalez@hospital.com'),
(2, HASHBYTES('SHA2_256', '123456'), 'dra.hernandez', 'dra.hernandez@hospital.com'),
(2, HASHBYTES('SHA2_256', '123456'), 'dr.ramirez', 'dr.ramirez@hospital.com'),
(3, HASHBYTES('SHA2_256', '123456'), 'recep.sofia', 'sofia@hospital.com'),
(4, HASHBYTES('SHA2_256', '123456'), 'farm.pedro', 'pedro@hospital.com');

-- ESTATUS EMPLEADOS
INSERT INTO EMPLEADO_ESTATUS (empleado_Estatus) VALUES
('Activo'),
('Inactivo'),
('Vacaciones'),
('Licencia'),
('Suspendido');

-- HORARIOS CORREGIDOS
INSERT INTO HORARIO (horario_turno, horario_inicio, horario_fin) VALUES
(0, '08:00:00', '16:00:00'), -- Matutino
(1, '16:00:00', '23:59:59'), -- Vespertino (corregido de 24:00:00)
(0, '08:00:00', '14:00:00'), -- Matutino corto
(1, '14:00:00', '20:00:00'), -- Vespertino corto
(0, '09:00:00', '17:00:00'), -- Matutino 9-5
(1, '17:00:00', '23:30:00'), -- Nocturno (corregido de 01:00:00)
(0, '07:00:00', '15:00:00'), -- Temprano
(1, '15:00:00', '23:00:00'), -- Tarde
(0, '10:00:00', '18:00:00'), -- Medio día
(1, '18:00:00', '23:45:00'); -- Noche (corregido de 02:00:00)

SELECT * FROM HORARIO;
DELETE FROM HORARIO WHERE id_horario > 14;

-- =====================================================
-- EMPLEADOS CON IDs CORRECTOS (USAR IDs QUE EXISTEN)
-- =====================================================

-- Usar horarios que SÍ existen (desde id 5 en adelante)
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
) VALUES
(1, 5, 1, 6, 'GOHJ850312HDFNZR01', 'Roberto', 'González', 'Hernández', '5551234567', 'roberto.gonzalez@hospital.com', 25000.00),
(2, 6, 1, 7, 'HELM901125MDFRDZ09', 'Laura', 'Hernández', 'Méndez', '5551234568', 'laura.hernandez@hospital.com', 28000.00),
(3, 7, 1, 8, 'RAPC780605HDFRML02', 'Carlos', 'Ramírez', 'Pérez', '5551234569', 'carlos.ramirez@hospital.com', 30000.00),
(4, 8, 1, 9, 'SOSM920815MDFNFL03', 'Sofía', 'Sánchez', 'Morales', '5551234570', 'sofia.sanchez@hospital.com', 18000.00),
(5, 9, 1, 10, 'PELR870420HDFRDP04', 'Pedro', 'Pérez', 'López', '5551234571', 'pedro.perez@hospital.com', 20000.00),
(6, 10, 1, 6, 'MART880201HDFRTN05', 'Antonio', 'Martínez', 'Torres', '5551234572', 'antonio.martinez@hospital.com', 26000.00),
(7, 11, 1, 7, 'GAVL910710MDFRCV06', 'Valeria', 'García', 'Vega', '5551234573', 'valeria.garcia@hospital.com', 24000.00),
(8, 12, 1, 8, 'LOJD830925HDFPNR07', 'David', 'López', 'Jiménez', '5551234574', 'david.lopez@hospital.com', 27000.00),
(9, 13, 1, 9, 'HEMA940312MDFRNL08', 'Alma', 'Hernández', 'Morales', '5551234575', 'alma.hernandez@hospital.com', 19000.00),
(10, 14, 1, 10, 'ROFE860508HDFDRN09', 'Fernando', 'Rodríguez', 'Espinoza', '5551234576', 'fernando.rodriguez@hospital.com', 21000.00);

-- Verificar que se insertaron correctamente
SELECT COUNT(*) AS Total_Empleados FROM EMPLEADO;
SELECT id_empleado, empleado_nombre, empleado_paterno, fk_id_horario FROM EMPLEADO;

-- PACIENTES
INSERT INTO PACIENTE (CURP, fk_pac_id_direccion, fk_pac_id_usuario, pac_nombre, pac_paterno, pac_materno, pac_fechaNacimiento, pac_edad, pac_tel) VALUES
('PEGJ900515HDFRZN01', 1, 1, 'Juan', 'Pérez', 'García', '1990-05-15', 34, '5559876543'),
('GAMA851120MDFRCR02', 2, 2, 'María', 'García', 'Martínez', '1985-11-20', 38, '5559876544'),
('LOCR880730HDFRRL03', 3, 3, 'Carlos', 'López', 'Cruz', '1988-07-30', 35, '5559876545'),
('MAHA920210MDFRNL04', 4, 4, 'Ana', 'Martínez', 'Hernández', '1992-02-10', 32, '5559876546'),
('ROLU940825HDFDRP05', 5, 5, 'Luis', 'Rodríguez', 'Luna', '1994-08-25', 29, '5559876547'),
('SEVP870315MDFRNV06', 6, 1, 'Verónica', 'Serna', 'Vega', '1987-03-15', 37, '5559876548'),
('TORD910505HDFRRM07', 7, 2, 'Daniel', 'Torres', 'Ruiz', '1991-05-05', 33, '5559876549'),
('MELE931128MDFNDL08', 8, 3, 'Elena', 'Méndez', 'López', '1993-11-28', 30, '5559876550'),
('CAOS890612HDFSTC09', 9, 4, 'Oscar', 'Castro', 'Salinas', '1989-06-12', 34, '5559876551'),
('RIJL950203MDFVLN10', 10, 5, 'Julia', 'Rivera', 'Jiménez', '1995-02-03', 29, '5559876552');

-- ESPECIALIDADES (10 requeridas mínimo)
INSERT INTO ESPECIALIDAD (descripcion, nombre_especialidad, costo_especialidad) VALUES
('Especialidad enfocada en el corazón y sistema cardiovascular', 'Cardiología', 1200.00),
('Especialidad de la piel, cabello y uñas', 'Dermatología', 800.00),
('Especialidad del sistema reproductor femenino', 'Ginecología', 900.00),
('Atención médica general y preventiva', 'Medicina General', 600.00),
('Especialidad de los riñones y vías urinarias', 'Nefrología', 1100.00),
('Especialidad en nutrición y alimentación', 'Nutriología', 700.00),
('Especialidad de los ojos y la visión', 'Oftalmología', 1000.00),
('Especialidad en tratamiento del cáncer', 'Oncología', 1500.00),
('Especialidad de huesos, articulaciones y músculos', 'Ortopedia', 1300.00),
('Especialidad médica para niños', 'Pediatría', 750.00);

-- CONSULTORIO_HORARIO
INSERT INTO CONSULTORIO_HORARIO (consultorio_turno, consultorio_fechahorainicio, consultorio_enUso) VALUES
(1, '2025-06-23 08:00:00', 0),
(2, '2025-06-23 16:00:00', 0),
(1, '2025-06-23 08:00:00', 0),
(2, '2025-06-23 16:00:00', 0),
(1, '2025-06-23 08:00:00', 0),
(2, '2025-06-23 16:00:00', 0),
(1, '2025-06-23 08:00:00', 0),
(2, '2025-06-23 16:00:00', 0),
(1, '2025-06-23 08:00:00', 0),
(2, '2025-06-23 16:00:00', 0);

-- CONSULTORIOS
INSERT INTO CONSULTORIO (fk_id_consultorioHorario, consultorio_numero) VALUES
(1, 101), (2, 102), (3, 103), (4, 104), (5, 105),
(6, 201), (7, 202), (8, 203), (9, 204), (10, 205);

SELECT id_empleado, empleado_nombre, empleado_paterno 
FROM EMPLEADO 
ORDER BY id_empleado;

-- =====================================================
-- MEDICOS CON IDs CORRECTOS (4-13)
-- =====================================================



INSERT INTO MEDICO (cedula, fk_med_id_empleado, fk_id_especialidad, fk_id_consultorio) VALUES
('CED123456789', 29, 1, 1),  -- Roberto González - Cardiólogo
('CED987654321', 30, 2, 2),  -- Laura Hernández - Dermatóloga
('CED456789123', 31, 3, 3),  -- Carlos Ramírez - Ginecólogo
('CED789123456', 32, 4, 4),  -- Sofía Sánchez - Medicina General
('CED321654987', 33, 5, 5),  -- Pedro Pérez - Nefrólogo
('CED654321789', 34, 6, 6),  -- Antonio Martínez - Nutriólogo
('CED159753486', 35, 7, 7),  -- Valeria García - Oftalmóloga
('CED486159753', 36, 8, 8),  -- David López - Oncólogo
('CED753159486', 37, 9, 9),  -- Alma Hernández - Ortopedista
('CED357951468', 38, 10, 10); -- Fernando Rodríguez - Pediatra


-- Verificar que se crearon correctamente
SELECT 
    m.cedula,
    e.empleado_nombre + ' ' + e.empleado_paterno AS nombre_medico,
    esp.nombre_especialidad,
    c.consultorio_numero
FROM MEDICO m
INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
INNER JOIN CONSULTORIO c ON m.fk_id_consultorio = c.id_consultorio
ORDER BY m.cedula;

-- Ver total de médicos creados
SELECT COUNT(*) AS Total_Medicos FROM MEDICO;

-- RECEPCIONISTAS (usamos ID 32 y 37 como ejemplo)
INSERT INTO RECEPCION (fk_recepcion_id_empleado) VALUES
(32), (37);
-- AGREGANDO NUEVOS EMPLEADOS

-- Paso 1: Insertar nuevos empleados (usa direcciones, usuarios y horarios válidos)
INSERT INTO EMPLEADO (
    fk_empleado_id_direccion, fk_id_horario, fk_id_empleadoEstatus,
    fk_empleado_id_usuario, empleado_CURP, empleado_nombre,
    empleado_paterno, empleado_materno, empleado_tel,
    empleado_correo, empleado_sueldo
)
VALUES
(1, 5, 1, 1, 'FARM123456HDFRZN01', 'Sandra', 'López', 'Ramírez', '5558881234', 'sandra.lopez@hospital.com', 18000),
(2, 6, 1, 2, 'FARM654321HDFRZN02', 'Jorge', 'Mendoza', 'González', '5558885678', 'jorge.mendoza@hospital.com', 18500);



-- FARMACÉUTICOS
INSERT INTO FARMACEUTICO (fk_farmaceutico_id_empleado) VALUES
(39), (40);

-- ESTATUS DE CITAS
INSERT INTO CITA_ESTATUS (estatusCita, descripcion) VALUES
('Agendada', 'Cita agendada pendiente de pago'),
('Pagada', 'Cita pagada pendiente por atender'),
('Cancelada Falta Pago', 'Cancelada por falta de pago en 8 hrs'),
('Cancelada Paciente', 'Cancelada por el paciente'),
('Cancelada Doctor', 'Cancelada por el doctor'),
('Atendida', 'Cita atendida exitosamente'),
('No Acudió', 'Paciente no se presentó a la cita');

-- PAGOS DE CITAS
INSERT INTO PAGO_CITA (pago_cantidadTotal, pago_abonado, pago_fechaHora, estatuspago) VALUES
(1200.00, 1200.00, '2025-06-20 10:30:00', 1),
(800.00, 800.00, '2025-06-20 11:15:00', 1),
(900.00, 900.00, '2025-06-20 14:20:00', 1),
(600.00, 600.00, '2025-06-21 09:45:00', 1),
(1100.00, 1100.00, '2025-06-21 16:30:00', 1),
(700.00, 0.00, '2025-06-22 08:15:00', 0),
(1000.00, 1000.00, '2025-06-22 13:20:00', 1),
(1500.00, 1500.00, '2025-06-22 15:45:00', 1),
(1300.00, 1300.00, '2025-06-23 10:15:00', 1),
(750.00, 0.00, '2025-06-23 11:30:00', 0);

-- CITAS
INSERT INTO CITA (fk_cita_CURP, fk_cedula, fk_id_citaEstatus, id_pago, cita_fechahora) VALUES
('PEGJ900515HDFRZN01', 'CED123456789', 6, 1, '2025-06-25 10:00:00'),
('GAMA851120MDFRCR02', 'CED987654321', 6, 2, '2025-06-25 11:00:00'),
('LOCR880730HDFRRL03', 'CED456789123', 6, 3, '2025-06-25 14:00:00'),
('MAHA920210MDFRNL04', 'CED789123456', 2, 4, '2025-06-26 09:00:00'),
('ROLU940825HDFDRP05', 'CED321654987', 2, 5, '2025-06-26 16:00:00'),
('SEVP870315MDFRNV06', 'CED654321789', 1, 6, '2025-06-27 08:00:00'),
('TORD910505HDFRRM07', 'CED159753486', 2, 7, '2025-06-27 13:00:00'),
('MELE931128MDFNDL08', 'CED486159753', 2, 8, '2025-06-27 15:00:00'),
('CAOS890612HDFSTC09', 'CED753159486', 2, 9, '2025-06-28 10:00:00'),
('RIJL950203MDFVLN10', 'CED357951468', 1, 10, '2025-06-28 11:00:00');

-- SERVICIOS (Mínimo 3 requeridos)
INSERT INTO SERVICIO (serv_costo, serv_descripcion, serv_nombre) VALUES
(150.00, 'Aplicación de inyección intramuscular', 'Inyección'),
(200.00, 'Aplicación de vacuna preventiva', 'Vacuna'),
(100.00, 'Curación de heridas menores', 'Curación'),
(300.00, 'Análisis completo de sangre', 'Estudio de sangre'),
(250.00, 'Radiografía de tórax', 'Radiografía'),
(180.00, 'Electrocardiograma completo', 'Electrocardiograma'),
(120.00, 'Toma de presión arterial', 'Toma de presión'),
(400.00, 'Ultrasonido abdominal', 'Ultrasonido'),
(90.00, 'Medición de glucosa', 'Glucometría'),
(220.00, 'Nebulización respiratoria', 'Nebulización');

-- MEDICAMENTOS
INSERT INTO MEDICAMENTO (med_nombre, med_stock, med_costo) VALUES
('Paracetamol 500mg', 100, 25.50),
('Ibuprofeno 400mg', 80, 35.00),
('Amoxicilina 500mg', 60, 120.00),
('Omeprazol 20mg', 90, 85.00),
('Losartán 50mg', 70, 95.00),
('Metformina 850mg', 85, 45.00),
('Atorvastatina 20mg', 50, 150.00),
('Captopril 25mg', 75, 30.00),
('Clonazepam 2mg', 40, 180.00),
('Salbutamol Spray', 65, 220.00);

-- RECETAS (Solo para citas atendidas)
INSERT INTO RECETA (fk_folio_cita, tratamiento, diagnostico, medicamento) VALUES
(1, 'Tomar 1 tableta cada 8 horas por 7 días', 'Hipertensión arterial leve', 'Losartán 50mg'),
(2, 'Aplicar crema 2 veces al día por 10 días', 'Dermatitis atópica', 'Crema hidrocortisona'),
(3, 'Control prenatal mensual', 'Embarazo de 12 semanas', 'Ácido fólico y hierro');

-- HISTORIAL MÉDICO
INSERT INTO HISTORIAL_MEDICO (fk_historialmed_CURP) VALUES
('PEGJ900515HDFRZN01'), ('GAMA851120MDFRCR02'), ('LOCR880730HDFRRL03'),
('MAHA920210MDFRNL04'), ('ROLU940825HDFDRP05'), ('SEVP870315MDFRNV06'),
('TORD910505HDFRRM07'), ('MELE931128MDFNDL08'), ('CAOS890612HDFSTC09'),
('RIJL950203MDFVLN10');

-- HISTORIAL DETALLE
INSERT INTO HISTORIAL_DETALLE (fk_id_historialMed, historialMed_fechhora, motivo_consulta, examen_fisico, diagnostico) VALUES
(1, '2025-06-20 10:00:00', 'Dolor de pecho', 'Presión arterial 140/90', 'Hipertensión arterial leve'),
(2, '2025-06-20 11:00:00', 'Manchas en la piel', 'Lesiones eritematosas', 'Dermatitis atópica'),
(3, '2025-06-20 14:00:00', 'Control prenatal', 'Abdomen gravídico', 'Embarazo de 12 semanas'),
(4, '2025-06-21 09:00:00', 'Dolor de cabeza', 'Signos vitales normales', 'Cefalea tensional'),
(5, '2025-06-21 16:00:00', 'Revisión de riñones', 'Dolor lumbar leve', 'Control nefrológico'),
(6, '2025-06-22 08:00:00', 'Consulta nutricional', 'Sobrepeso', 'Plan alimentario'),
(7, '2025-06-22 13:00:00', 'Problemas de visión', 'Agudeza visual disminuida', 'Miopía'),
(8, '2025-06-22 15:00:00', 'Seguimiento oncológico', 'Estado general bueno', 'Control post-tratamiento'),
(9, '2025-06-23 10:00:00', 'Dolor en rodilla', 'Inflamación articular', 'Artritis leve'),
(10, '2025-06-23 11:00:00', 'Control pediátrico', 'Desarrollo normal', 'Niño sano');

-- VENTAS DE FARMACIA
INSERT INTO VENTA (fk_id_farmaceutico, venta_fechahora, totalPago) VALUES
(1, '2025-06-20 12:30:00', 145.50),
(2, '2025-06-20 15:45:00', 320.00),
(1, '2025-06-21 10:15:00', 85.00),
(2, '2025-06-21 14:30:00', 275.50),
(1, '2025-06-22 09:20:00', 120.00),
(2, '2025-06-22 16:45:00', 395.00),
(1, '2025-06-23 11:30:00', 180.00),
(2, '2025-06-23 13:15:00', 95.00),
(1, '2025-06-23 15:45:00', 220.00),
(2, '2025-06-23 17:30:00', 150.00);

-- DETALLE DE VENTAS
INSERT INTO VENTA_DETALLE (fk_id_medicamento, fk_id_servicio, fk_id_venta, cantidadMedicamento, cantidadServicios) VALUES
(1, 1, 1, 2, 1), -- Paracetamol + Inyección
(3, NULL, 2, 1, 0), -- Amoxicilina
(4, NULL, 3, 1, 0), -- Omeprazol
(2, 2, 4, 3, 1), -- Ibuprofeno + Vacuna
(1, NULL, 5, 2, 0), -- Paracetamol
(7, 4, 6, 1, 1), -- Atorvastatina + Estudio sangre
(9, NULL, 7, 1, 0), -- Clonazepam
(5, NULL, 8, 1, 0), -- Losartán
(10, NULL, 9, 1, 0), -- Salbutamol
(6, 3, 10, 2, 1); -- Metformina + Curación

-- =====================================================
-- STORED PROCEDURES (2 REQUERIDOS)
-- =====================================================

-- SP 1: Actualizar estatus de cita
CREATE PROCEDURE SP_ActualizarEstatusCita
    @folio_cita INT,
    @nuevo_estatus INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la cita existe
        IF NOT EXISTS (SELECT 1 FROM CITA WHERE folio_cita = @folio_cita)
        BEGIN
            RAISERROR('La cita no existe', 16, 1);
            RETURN;
        END
        
        -- Actualizar estatus
        UPDATE CITA 
        SET fk_id_citaEstatus = @nuevo_estatus
        WHERE folio_cita = @folio_cita;
        
        COMMIT TRANSACTION;
        
        PRINT 'Estatus de cita actualizado correctamente';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP 2: Calcular total de venta
CREATE PROCEDURE SP_CalcularTotalVenta
    @id_venta INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @total MONEY = 0;
    
    -- Calcular total de medicamentos
    SELECT @total = @total + ISNULL(SUM(m.med_costo * vd.cantidadMedicamento), 0)
    FROM VENTA_DETALLE vd
    INNER JOIN MEDICAMENTO m ON vd.fk_id_medicamento = m.id_medicamento
    WHERE vd.fk_id_venta = @id_venta;
    
    -- Calcular total de servicios
    SELECT @total = @total + ISNULL(SUM(s.serv_costo * vd.cantidadServicios), 0)
    FROM VENTA_DETALLE vd
    INNER JOIN SERVICIO s ON vd.fk_id_servicio = s.id_servicio
    WHERE vd.fk_id_venta = @id_venta;
    
    -- Actualizar el total en la venta
    UPDATE VENTA 
    SET totalPago = @total
    WHERE id_venta = @id_venta;
    
    SELECT @total AS TotalCalculado;
END;
GO

-- =====================================================
-- TRIGGERS (3 REQUERIDOS: INSERT, UPDATE, DELETE)
-- =====================================================

-- Crear tabla de bitácora para los triggers
CREATE TABLE BITACORA_CITAS (
    id_bitacora INT IDENTITY(1,1) PRIMARY KEY,
    folio_cita INT,
    accion VARCHAR(10),
    usuario_sistema VARCHAR(50),
    fecha_movimiento DATETIME DEFAULT GETDATE(),
    estatus_anterior INT,
    estatus_nuevo INT,
    observaciones VARCHAR(200)
);
GO

-- TRIGGER 1: INSERT en CITA
CREATE TRIGGER TR_InsertCita
ON CITA
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO BITACORA_CITAS (folio_cita, accion, usuario_sistema, estatus_nuevo, observaciones)
    SELECT 
        i.folio_cita,
        'INSERT',
        SYSTEM_USER,
        i.fk_id_citaEstatus,
        'Nueva cita creada'
    FROM inserted i;
END;
GO

-- TRIGGER 2: UPDATE en CITA
CREATE TRIGGER TR_UpdateCita
ON CITA
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO BITACORA_CITAS (folio_cita, accion, usuario_sistema, estatus_anterior, estatus_nuevo, observaciones)
    SELECT 
        i.folio_cita,
        'UPDATE',
        SYSTEM_USER,
        d.fk_id_citaEstatus,
        i.fk_id_citaEstatus,
        'Cita actualizada'
    FROM inserted i
    INNER JOIN deleted d ON i.folio_cita = d.folio_cita;
END;
GO

-- TRIGGER 3: DELETE en CITA
CREATE TRIGGER TR_DeleteCita
ON CITA
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO BITACORA_CITAS (folio_cita, accion, usuario_sistema, estatus_anterior, observaciones)
    SELECT 
        d.folio_cita,
        'DELETE',
        SYSTEM_USER,
        d.fk_id_citaEstatus,
        'Cita eliminada'
    FROM deleted d;
END;
GO

-- =====================================================
-- VISTAS ÚTILES PARA EL SISTEMA
-- =====================================================

-- Vista de citas con información completa
CREATE VIEW VW_CitasCompletas AS
SELECT 
    c.folio_cita,
    p.pac_nombre + ' ' + p.pac_paterno + ' ' + ISNULL(p.pac_materno, '') AS nombre_paciente,
    p.CURP,
    e.empleado_nombre + ' ' + e.empleado_paterno AS nombre_medico,
    m.cedula,
    esp.nombre_especialidad,
    esp.costo_especialidad,
    c.cita_fechahora,
    cons.consultorio_numero,
    cs.estatusCita,
    pc.pago_cantidadTotal,
    pc.estatuspago
FROM CITA c
INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
INNER JOIN CONSULTORIO cons ON m.fk_id_consultorio = cons.id_consultorio
INNER JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago;
GO

-- Vista de medicamentos con stock bajo
CREATE VIEW VW_MedicamentosStockBajo AS
SELECT 
    id_medicamento,
    med_nombre,
    med_stock,
    med_costo,
    CASE 
        WHEN med_stock = 0 THEN 'AGOTADO'
        WHEN med_stock <= 10 THEN 'STOCK BAJO'
        ELSE 'STOCK NORMAL'
    END AS estado_stock
FROM MEDICAMENTO
WHERE med_stock <= 20;
GO

-- Vista de ventas por farmacéutico
CREATE VIEW VW_VentasFarmaceutico AS
SELECT 
    f.id_farmaceutico,
    e.empleado_nombre + ' ' + e.empleado_paterno AS nombre_farmaceutico,
    COUNT(v.id_venta) AS total_ventas,
    SUM(v.totalPago) AS total_ingresos,
    AVG(v.totalPago) AS promedio_venta
FROM FARMACEUTICO f
INNER JOIN EMPLEADO e ON f.fk_farmaceutico_id_empleado = e.id_empleado
LEFT JOIN VENTA v ON f.id_farmaceutico = v.fk_id_farmaceutico
GROUP BY f.id_farmaceutico, e.empleado_nombre, e.empleado_paterno;
GO

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para calcular edad actual
CREATE FUNCTION FN_CalcularEdad(@fecha_nacimiento DATE)
RETURNS INT
AS
BEGIN
    DECLARE @edad INT;
    
    SET @edad = DATEDIFF(YEAR, @fecha_nacimiento, GETDATE()) - 
                CASE 
                    WHEN MONTH(@fecha_nacimiento) > MONTH(GETDATE()) 
                         OR (MONTH(@fecha_nacimiento) = MONTH(GETDATE()) 
                             AND DAY(@fecha_nacimiento) > DAY(GETDATE()))
                    THEN 1 
                    ELSE 0 
                END;
    
    RETURN @edad;
END;
GO

-- Función para validar disponibilidad de horario médico
CREATE FUNCTION FN_ValidarDisponibilidadMedico(
    @cedula VARCHAR(20),
    @fecha_hora DATETIME
)
RETURNS BIT
AS
BEGIN
    DECLARE @disponible BIT = 1;
    
    -- Verificar si ya tiene cita en esa fecha y hora
    IF EXISTS (
        SELECT 1 
        FROM CITA 
        WHERE fk_cedula = @cedula 
        AND cita_fechahora = @fecha_hora
        AND fk_id_citaEstatus IN (1, 2) -- Agendada o Pagada
    )
    BEGIN
        SET @disponible = 0;
    END
    
    RETURN @disponible;
END;
GO

-- =====================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

-- Índices en tablas principales
CREATE NONCLUSTERED INDEX IX_CITA_Fecha ON CITA(cita_fechahora);
CREATE NONCLUSTERED INDEX IX_CITA_Medico ON CITA(fk_cedula);
CREATE NONCLUSTERED INDEX IX_CITA_Paciente ON CITA(fk_cita_CURP);
CREATE NONCLUSTERED INDEX IX_PACIENTE_Nombre ON PACIENTE(pac_nombre, pac_paterno);
CREATE NONCLUSTERED INDEX IX_EMPLEADO_CURP ON EMPLEADO(empleado_CURP);
CREATE NONCLUSTERED INDEX IX_VENTA_Fecha ON VENTA(venta_fechahora);

-- =====================================================
-- DATOS ADICIONALES PARA PRUEBAS
-- =====================================================

-- Actualizar edades de pacientes usando la función
UPDATE PACIENTE 
SET pac_edad = dbo.FN_CalcularEdad(pac_fechaNacimiento);

PRINT '====================================================';
PRINT 'BASE DE DATOS HOSPITAL CREADA EXITOSAMENTE';
PRINT '====================================================';
PRINT 'Tablas creadas: 23';
PRINT 'Stored Procedures: 2';
PRINT 'Triggers: 3';
PRINT 'Vistas: 3';
PRINT 'Funciones: 2';
PRINT 'Registros de prueba: Más de 100';
PRINT '====================================================';

-- Mostrar resumen de datos
SELECT 'PACIENTES' AS Tabla, COUNT(*) AS Registros FROM PACIENTE
UNION ALL
SELECT 'MÉDICOS', COUNT(*) FROM MEDICO
UNION ALL
SELECT 'EMPLEADOS', COUNT(*) FROM EMPLEADO
UNION ALL
SELECT 'CITAS', COUNT(*) FROM CITA
UNION ALL
SELECT 'ESPECIALIDADES', COUNT(*) FROM ESPECIALIDAD
UNION ALL
SELECT 'MEDICAMENTOS', COUNT(*) FROM MEDICAMENTO
UNION ALL
SELECT 'SERVICIOS', COUNT(*) FROM SERVICIO
UNION ALL
SELECT 'VENTAS', COUNT(*) FROM VENTA;

-- =====================================================
-- SCRIPT DE VALIDACIÓN
-- =====================================================

-- Verificar integridad referencial
PRINT 'Verificando integridad referencial...';

-- Verificar que todos los médicos tienen empleado válido
IF EXISTS (
    SELECT 1 FROM MEDICO m 
    LEFT JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado 
    WHERE e.id_empleado IS NULL
)
    PRINT 'ERROR: Hay médicos sin empleado asociado';
ELSE
    PRINT 'OK: Todos los médicos tienen empleado asociado';

-- Verificar que todas las citas tienen paciente válido
IF EXISTS (
    SELECT 1 FROM CITA c 
    LEFT JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP 
    WHERE p.CURP IS NULL
)
    PRINT 'ERROR: Hay citas sin paciente asociado';
ELSE
    PRINT 'OK: Todas las citas tienen paciente asociado';

PRINT 'Base de datos lista para usar!';

END 
GO
--------------------------------------------

CREATE OR ALTER TRIGGER TR_ValidarCitas
ON CITA
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Tabla para conflictos
    DECLARE @Conflictos TABLE (
        motivo VARCHAR(200),
        detalle VARCHAR(200)
    );
    
    -- Validar tamaño de datos
    INSERT INTO @Conflictos
    SELECT 
        'Datos muy largos para columna ' + 
        CASE 
            WHEN LEN(i.fk_cita_CURP) > 18 THEN 'fk_cita_CURP (máx 18)'
            WHEN LEN(i.fk_cedula) > 20 THEN 'fk_cedula (máx 20)'
            ELSE 'desconocida'
        END,
        'Intento de insertar: ' + 
        CASE 
            WHEN LEN(i.fk_cita_CURP) > 18 THEN LEFT(i.fk_cita_CURP, 30) + '...'
            WHEN LEN(i.fk_cedula) > 20 THEN LEFT(i.fk_cedula, 30) + '...'
            ELSE 'verificar datos'
        END
    FROM inserted i
    WHERE LEN(i.fk_cita_CURP) > 18 OR LEN(i.fk_cedula) > 20;
    
    -- Validar duplicados
    INSERT INTO @Conflictos
    SELECT 
        'Conflicto de horario',
        'Médico: ' + i.fk_cedula + ' - Paciente: ' + i.fk_cita_CURP + 
        ' - Fecha: ' + CONVERT(VARCHAR, i.cita_fechahora, 120)
    FROM inserted i
    WHERE EXISTS (
        SELECT 1 FROM CITA c
        WHERE (c.fk_cedula = i.fk_cedula OR c.fk_cita_CURP = i.fk_cita_CURP)
        AND c.cita_fechahora = i.cita_fechahora
        AND c.fk_id_citaEstatus IN (1, 2) -- Agendada o Pagada
    );
    
    -- Mostrar errores o insertar
    IF EXISTS (SELECT 1 FROM @Conflictos)
    BEGIN
        DECLARE @msg VARCHAR(MAX) = '';
        SELECT @msg = @msg + motivo + ': ' + detalle + CHAR(10)
        FROM @Conflictos;
        
        RAISERROR('Error de validación:%s', 16, 1, @msg);
        RETURN;
    END
    
    -- Inserción segura
    INSERT INTO CITA (
        fk_cita_CURP, fk_cedula, fk_id_citaEstatus, id_pago, cita_fechahora
    )
    SELECT 
        LEFT(fk_cita_CURP, 18), -- Asegura no exceder límite
        LEFT(fk_cedula, 20),     -- Asegura no exceder límite
        fk_id_citaEstatus, 
        id_pago, 
        cita_fechahora
    FROM inserted;
END;
GO

-------------------------------

SELECT M.cedula, H.horario_inicio, H.horario_fin
FROM MEDICO M
JOIN EMPLEADO E ON M.fk_med_id_empleado = E.id_empleado
JOIN HORARIO H ON E.fk_id_horario = H.id_horario
WHERE M.cedula = 'LA_CEDULA_DEL_DOCTOR';


INSERT INTO HORARIO (horario_turno, horario_inicio, horario_fin)
VALUES 
(1, '08:00', '14:00'),  -- Turno matutino
(0, '14:00', '20:00');  -- Turno vespertino

UPDATE EMPLEADO
SET fk_id_horario = 1 -- O el ID que corresponda al turno correcto
WHERE id_empleado = (SELECT fk_med_id_empleado FROM MEDICO WHERE cedula = 'MED123456');


SELECT M.cedula, H.horario_inicio, H.horario_fin
FROM MEDICO M
JOIN EMPLEADO E ON M.fk_med_id_empleado = E.id_empleado
JOIN HORARIO H ON E.fk_id_horario = H.id_horario

-- ===============================
-- VERIFICAR Y CREAR TABLA RECETA
-- ===============================

-- Primero verificar si la tabla existe
IF EXISTS (SELECT * FROM sysobjects WHERE name='RECETA' AND xtype='U')
BEGIN
    PRINT 'La tabla RECETA ya existe. Verificando estructura...';
    
    -- Verificar columnas existentes
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'RECETA'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT 'Creando tabla RECETA...';
    
    CREATE TABLE RECETA (
        id_receta INT IDENTITY(1,1) PRIMARY KEY,
        folio_receta VARCHAR(30) UNIQUE NOT NULL,
        fk_folio_cita INT NOT NULL,
        fk_cedula_medico VARCHAR(20) NOT NULL,
        fk_curp_paciente VARCHAR(18) NOT NULL,
        fecha_emision DATETIME NOT NULL DEFAULT GETDATE(),
        diagnostico VARCHAR(200) NOT NULL,
        tratamiento VARCHAR(800) NOT NULL,
        medicamentos VARCHAR(2000) NOT NULL,
        observaciones_generales VARCHAR(800),
        estatus_receta VARCHAR(20) DEFAULT 'Activa',
        fecha_modificacion DATETIME DEFAULT GETDATE(),
        
        -- Constraints (sin foreign keys por ahora para evitar errores)
        CONSTRAINT CK_RECETA_estatus CHECK (estatus_receta IN ('Activa', 'Cancelada', 'Vencida'))
    );
    
    -- Crear índices
    CREATE INDEX IX_RECETA_cedula_medico ON RECETA(fk_cedula_medico);
    CREATE INDEX IX_RECETA_curp_paciente ON RECETA(fk_curp_paciente);
    CREATE INDEX IX_RECETA_folio_cita ON RECETA(fk_folio_cita);
    CREATE INDEX IX_RECETA_fecha_emision ON RECETA(fecha_emision);
    
    PRINT 'Tabla RECETA creada correctamente con índices';
END

-- Verificar estructura final
PRINT 'Estructura actual de la tabla RECETA:';
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE + 
    CASE 
        WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL 
        THEN '(' + CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ')'
        ELSE ''
    END as 'Tipo',
    CASE WHEN IS_NULLABLE = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as 'Nulable',
    COLUMN_DEFAULT as 'Valor_Por_Defecto'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'RECETA'
ORDER BY ORDINAL_POSITION;

------------------------------------------------------

-- ===============================
-- VERIFICAR Y CREAR TABLA RECETA PASO A PASO
-- ===============================

-- 1. Verificar si la tabla existe
PRINT '1. Verificando si la tabla RECETA existe...';
IF EXISTS (SELECT * FROM sysobjects WHERE name='RECETA' AND xtype='U')
BEGIN
    PRINT '   ✅ La tabla RECETA ya existe';
    
    -- Mostrar estructura actual
    PRINT '   📋 Estructura actual:';
    SELECT 
        COLUMN_NAME as 'Columna',
        DATA_TYPE + 
        CASE 
            WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL 
            THEN '(' + CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ')'
            ELSE ''
        END as 'Tipo',
        CASE WHEN IS_NULLABLE = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as 'Nulable'
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'RECETA'
    ORDER BY ORDINAL_POSITION;
    
    -- Verificar si tiene datos
    DECLARE @total_recetas INT;
    SELECT @total_recetas = COUNT(*) FROM RECETA;
    PRINT '   📊 Total de recetas existentes: ' + CAST(@total_recetas AS VARCHAR);
    
    -- Si quieres recrear la tabla, descomenta las siguientes líneas:
    -- PRINT '   🗑️ Eliminando tabla existente...';
    -- DROP TABLE RECETA;
    -- PRINT '   ✅ Tabla eliminada';
END
ELSE
BEGIN
    PRINT '   ❌ La tabla RECETA NO existe';
END

-- 2. Crear la tabla si no existe
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RECETA' AND xtype='U')
BEGIN
    PRINT '2. Creando tabla RECETA...';
    
    CREATE TABLE RECETA (
        id_receta INT IDENTITY(1,1) PRIMARY KEY,
        folio_receta VARCHAR(30) UNIQUE NOT NULL,
        fk_folio_cita INT NOT NULL,
        fk_cedula_medico VARCHAR(20) NOT NULL,
        fk_curp_paciente VARCHAR(18) NOT NULL,
        fecha_emision DATETIME NOT NULL DEFAULT GETDATE(),
        diagnostico VARCHAR(200) NOT NULL,
        tratamiento VARCHAR(800) NOT NULL,
        medicamentos VARCHAR(2000) NOT NULL,
        observaciones_generales VARCHAR(800),
        estatus_receta VARCHAR(20) DEFAULT 'Activa',
        fecha_modificacion DATETIME DEFAULT GETDATE()
    );
    
    -- Crear índices para mejorar performance
    CREATE INDEX IX_RECETA_cedula_medico ON RECETA(fk_cedula_medico);
    CREATE INDEX IX_RECETA_curp_paciente ON RECETA(fk_curp_paciente);
    CREATE INDEX IX_RECETA_folio_cita ON RECETA(fk_folio_cita);
    CREATE INDEX IX_RECETA_fecha_emision ON RECETA(fecha_emision);
    
    PRINT '   ✅ Tabla RECETA creada correctamente con índices';
END
ELSE
BEGIN
    PRINT '2. ✅ La tabla RECETA ya existe, no es necesario crearla';
END

-- 3. Verificar estructura final
PRINT '3. Estructura final de la tabla RECETA:';
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE + 
    CASE 
        WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL 
        THEN '(' + CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ')'
        WHEN NUMERIC_PRECISION IS NOT NULL
        THEN '(' + CAST(NUMERIC_PRECISION AS VARCHAR) + 
             CASE WHEN NUMERIC_SCALE IS NOT NULL 
                  THEN ',' + CAST(NUMERIC_SCALE AS VARCHAR) 
                  ELSE '' END + ')'
        ELSE ''
    END as 'Tipo_Completo',
    CASE WHEN IS_NULLABLE = 'YES' THEN 'SÍ' ELSE 'NO' END as 'Permite_NULL',
    COLUMN_DEFAULT as 'Valor_Por_Defecto'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'RECETA'
ORDER BY ORDINAL_POSITION;

-- 4. Probar inserción de una receta de prueba
PRINT '4. Probando inserción de receta de prueba...';
BEGIN TRY
    -- Obtener una cita atendida para la prueba
    DECLARE @folio_prueba INT;
    DECLARE @cedula_prueba VARCHAR(20);
    DECLARE @curp_prueba VARCHAR(18);
    
    SELECT TOP 1 
        @folio_prueba = c.folio_cita,
        @cedula_prueba = m.cedula,
        @curp_prueba = c.fk_cita_CURP
    FROM CITA c
    INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
    LEFT JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
    WHERE cs.estatusCita = 'Atendida';
    
    IF @folio_prueba IS NOT NULL
    BEGIN
        -- Verificar si ya existe receta para esta cita
        IF NOT EXISTS (SELECT 1 FROM RECETA WHERE fk_folio_cita = @folio_prueba)
        BEGIN
            INSERT INTO RECETA (
                folio_receta,
                fk_folio_cita,
                fk_cedula_medico,
                fk_curp_paciente,
                diagnostico,
                tratamiento,
                medicamentos,
                observaciones_generales
            )
            VALUES (
                'REC-PRUEBA-' + CAST(@folio_prueba AS VARCHAR),
                @folio_prueba,
                @cedula_prueba,
                @curp_prueba,
                'Diagnóstico de prueba',
                'Tratamiento de prueba',
                'Paracetamol 500mg - Cada 8 horas por 3 días',
                'Receta de prueba del sistema'
            );
            
            PRINT '   ✅ Receta de prueba insertada correctamente';
            PRINT '   📝 Folio: REC-PRUEBA-' + CAST(@folio_prueba AS VARCHAR);
        END
        ELSE
        BEGIN
            PRINT '   ℹ️ Ya existe una receta para la cita de prueba';
        END
    END
    ELSE
    BEGIN
        PRINT '   ⚠️ No se encontraron citas atendidas para hacer la prueba';
    END
END TRY
BEGIN CATCH
    PRINT '   ❌ Error al insertar receta de prueba: ' + ERROR_MESSAGE();
END CATCH

PRINT '===============================';
PRINT '✅ Verificación completada';
PRINT '===============================';

SELECT * FROM PACIENTE

SELECT * FROM CITA_ESTATUS

UPDATE USUARIO 
SET contrasena = HASHBYTES('SHA2_256', 'Doctor5411!')
WHERE usuario_nombre = 'dr.gregory.house';

SELECT * FROM PACIENTE
SELECT * FROM EMPLEADO
SELECT * FROM EMPLEADO_ESTATUS