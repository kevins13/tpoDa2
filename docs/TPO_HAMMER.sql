-- SISTEMA DE SUBASTAS - TPO_HAMMER
-- Script completo: estructura + datos de prueba

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'TPO_HAMMER')
BEGIN
    ALTER DATABASE TPO_HAMMER SET SINGLE_USER WITH ROLLBACK IMMEDIATE
    DROP DATABASE TPO_HAMMER
END
GO

CREATE DATABASE TPO_HAMMER
GO

USE TPO_HAMMER
GO

-- TABLAS BASE (sin dependencias)

CREATE TABLE paises (
    numero          INT             NOT NULL,
    nombre          VARCHAR(250)    NOT NULL,
    nombreCorto     VARCHAR(250)    NULL,
    capital         VARCHAR(250)    NOT NULL,
    nacionalidad    VARCHAR(250)    NOT NULL,
    idiomas         VARCHAR(150)    NOT NULL,
    CONSTRAINT pk_paises PRIMARY KEY (numero)
)
GO

CREATE TABLE personas (
    identificador   INT             NOT NULL IDENTITY,
    documento       VARCHAR(20)     NOT NULL,
    nombre          VARCHAR(150)    NOT NULL,
    direccion       VARCHAR(250)    NULL,
    estado          VARCHAR(15)     CONSTRAINT chkEstado CHECK (estado IN ('activo', 'inactivo')),
    foto            VARBINARY(MAX)  NULL,
    CONSTRAINT pk_personas PRIMARY KEY (identificador)
)
GO

CREATE TABLE empleados (
    identificador   INT             NOT NULL,
    cargo           VARCHAR(100)    NULL,
    sector          INT             NULL,
    CONSTRAINT pk_empleados PRIMARY KEY (identificador)
)
GO

CREATE TABLE sectores (
    identificador       INT             NOT NULL IDENTITY,
    nombreSector        VARCHAR(150)    NOT NULL,
    codigoSector        VARCHAR(10)     NULL,
    responsableSector   INT             NULL,
    CONSTRAINT pk_sectores PRIMARY KEY (identificador),
    CONSTRAINT fk_sectores_empleados FOREIGN KEY (responsableSector) REFERENCES empleados (identificador)
)
GO

CREATE TABLE seguros (
    nroPoliza           VARCHAR(30)     NOT NULL,
    compania            VARCHAR(150)    NOT NULL,
    polizaCombinada     VARCHAR(2)      CONSTRAINT chkPolizaCombinada CHECK (polizaCombinada IN ('si', 'no')),
    importe             DECIMAL(18,2)   NOT NULL CONSTRAINT chkImporte CHECK (importe > 0),
    CONSTRAINT pk_seguros PRIMARY KEY (nroPoliza)
)
GO

-- TABLAS DE PERSONAS (heredan de personas)

CREATE TABLE clientes (
    identificador       INT         NOT NULL,
    numeroPais          INT         NULL,
    admitido            VARCHAR(2)  CONSTRAINT chkAdmitido CHECK (admitido IN ('si', 'no')),
    categoria           VARCHAR(10) CONSTRAINT chkCategoria CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino')),
    verificador         INT         NOT NULL,
    -- Fotos del documento para registracion (frente y dorso)
    fotoDocFrente       VARCHAR(300) NULL,
    fotoDocDorso        VARCHAR(300) NULL,
    CONSTRAINT pk_clientes PRIMARY KEY (identificador),
    CONSTRAINT fk_clientes_personas  FOREIGN KEY (identificador) REFERENCES personas (identificador),
    CONSTRAINT fk_clientes_empleados FOREIGN KEY (verificador)   REFERENCES empleados (identificador),
    CONSTRAINT fk_clientes_paises    FOREIGN KEY (numeroPais)    REFERENCES paises (numero)
)
GO

CREATE TABLE duenios (
    identificador           INT         NOT NULL,
    numeroPais              INT         NULL,
    verificacionFinanciera  VARCHAR(2)  CONSTRAINT chkVF CHECK (verificacionFinanciera IN ('si', 'no')),
    verificacionJudicial    VARCHAR(2)  CONSTRAINT chkVJ CHECK (verificacionJudicial IN ('si', 'no')),
    calificacionRiesgo      INT         CONSTRAINT chkCR CHECK (calificacionRiesgo IN (1, 2, 3, 4, 5, 6)),
    verificador             INT         NOT NULL,
    CONSTRAINT pk_duenios PRIMARY KEY (identificador),
    CONSTRAINT fk_duenios_personas  FOREIGN KEY (identificador) REFERENCES personas (identificador),
    CONSTRAINT fk_duenios_empleados FOREIGN KEY (verificador)   REFERENCES empleados (identificador)
)
GO

CREATE TABLE subastadores (
    identificador   INT             NOT NULL,
    matricula       VARCHAR(15)     NULL,
    region          VARCHAR(50)     NULL,
    CONSTRAINT pk_subastadores PRIMARY KEY (identificador),
    CONSTRAINT fk_subastadores_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
)
GO

-- MEDIOS DE PAGO


-- Tabla base de medios de pago de cada cliente
CREATE TABLE mediosDePago (
    identificador   INT             NOT NULL IDENTITY,
    cliente         INT             NOT NULL,
    tipo            VARCHAR(20)     NOT NULL CONSTRAINT chkTipoMedio CHECK (tipo IN ('cuenta_bancaria', 'tarjeta_credito', 'cheque')),
    moneda          VARCHAR(10)     NOT NULL CONSTRAINT chkMonedaMedio CHECK (moneda IN ('pesos', 'dolares')),
    verificado      VARCHAR(2)      NOT NULL DEFAULT 'no' CONSTRAINT chkVerificado CHECK (verificado IN ('si', 'no')),
    activo          VARCHAR(2)      NOT NULL DEFAULT 'si' CONSTRAINT chkActivoMedio CHECK (activo IN ('si', 'no')),
    CONSTRAINT pk_mediosDePago PRIMARY KEY (identificador),
    CONSTRAINT fk_mediosDePago_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador)
)
GO

-- Cuentas bancarias (nacionales o extranjeras)
CREATE TABLE cuentasBancarias (
    identificador   INT             NOT NULL,
    banco           VARCHAR(150)    NOT NULL,
    nroCuenta       VARCHAR(50)     NOT NULL,
    cbu             VARCHAR(22)     NULL,
    swift           VARCHAR(11)     NULL,
    -- Monto reservado para operar en subastas
    montoReservado  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    CONSTRAINT pk_cuentasBancarias PRIMARY KEY (identificador),
    CONSTRAINT fk_cuentasBancarias_medios FOREIGN KEY (identificador) REFERENCES mediosDePago (identificador)
)
GO

-- Tarjetas de credito (nacionales o extranjeras)
CREATE TABLE tarjetasCredito (
    identificador   INT             NOT NULL,
    numeroTarjeta   VARCHAR(20)     NOT NULL,
    titular         VARCHAR(150)    NOT NULL,
    vencimiento     VARCHAR(7)      NOT NULL,
    red             VARCHAR(30)     NOT NULL,
    CONSTRAINT pk_tarjetasCredito PRIMARY KEY (identificador),
    CONSTRAINT fk_tarjetasCredito_medios FOREIGN KEY (identificador) REFERENCES mediosDePago (identificador)
)
GO

-- Cheques certificados con monto determinado entregado antes de la subasta
CREATE TABLE chequesCertificados (
    identificador   INT             NOT NULL,
    nroCheque       VARCHAR(30)     NOT NULL,
    banco           VARCHAR(150)    NOT NULL,
    monto           DECIMAL(18,2)   NOT NULL CONSTRAINT chkMontoCheque CHECK (monto > 0),
    -- Monto disponible restante (se va descontando con las compras)
    montoDisponible DECIMAL(18,2)   NOT NULL,
    vencimiento     DATE            NOT NULL,
    CONSTRAINT pk_chequesCertificados PRIMARY KEY (identificador),
    CONSTRAINT fk_chequesCertificados_medios FOREIGN KEY (identificador) REFERENCES mediosDePago (identificador)
)
GO

-- TABLAS PRINCIPALES DEL NEGOCIO

CREATE TABLE subastas (
    identificador       INT             NOT NULL IDENTITY,
    fecha               DATE            CONSTRAINT chkFecha CHECK (fecha > DATEADD(dd, 10, GETDATE())),
    hora                TIME            NOT NULL,
    estado              VARCHAR(10)     CONSTRAINT chkEstadoSubasta CHECK (estado IN ('abierta', 'cerrada')),
    subastador          INT             NULL,
    ubicacion           VARCHAR(350)    NULL,
    capacidadAsistentes INT             NULL,
    tieneDeposito       VARCHAR(2)      CONSTRAINT chkTieneDeposito   CHECK (tieneDeposito   IN ('si', 'no')),
    seguridadPropia     VARCHAR(2)      CONSTRAINT chkSeguridadPropia CHECK (seguridadPropia IN ('si', 'no')),
    categoria           VARCHAR(10)     CONSTRAINT chkCategoriaSubasta CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino')),
    -- Moneda de la subasta: no puede ser bimonetaria
    moneda              VARCHAR(10)     NOT NULL DEFAULT 'pesos' CONSTRAINT chkMoneda CHECK (moneda IN ('pesos', 'dolares')),
    CONSTRAINT pk_subastas PRIMARY KEY (identificador),
    CONSTRAINT fk_subastas_subastadores FOREIGN KEY (subastador) REFERENCES subastadores (identificador)
)
GO

CREATE TABLE productos (
    identificador       INT             NOT NULL IDENTITY,
    fecha               DATE            NULL,
    disponible          VARCHAR(2)      CONSTRAINT chkDisponible CHECK (disponible IN ('si', 'no')),
    -- Descripcion corta para el catalogo, la completa el empleado revisor
    descripcionCatalogo VARCHAR(500)    NULL DEFAULT 'No Posee',
    -- URL al PDF firmado con descripcion completa. Se carga desde el back una vez disponible
    descripcionCompleta VARCHAR(300)    NULL,
    revisor             INT             NOT NULL,
    duenio              INT             NOT NULL,
    seguro              VARCHAR(30)     NULL,
    CONSTRAINT pk_productos PRIMARY KEY (identificador),
    CONSTRAINT fk_productos_empleados FOREIGN KEY (revisor) REFERENCES empleados (identificador),
    CONSTRAINT fk_productos_duenios   FOREIGN KEY (duenio)  REFERENCES duenios   (identificador),
    CONSTRAINT fk_productos_seguros   FOREIGN KEY (seguro)  REFERENCES seguros   (nroPoliza)
)
GO

-- Fotos de los productos (aprox. 6 por producto segun consigna)
CREATE TABLE fotos (
    identificador   INT             NOT NULL IDENTITY,
    producto        INT             NOT NULL,
    foto            VARBINARY(MAX)  NOT NULL,
    CONSTRAINT pk_fotos PRIMARY KEY (identificador),
    CONSTRAINT fk_fotos_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
)
GO

CREATE TABLE catalogos (
    identificador   INT             NOT NULL IDENTITY,
    descripcion     VARCHAR(250)    NOT NULL,
    subasta         INT             NULL,
    responsable     INT             NOT NULL,
    CONSTRAINT pk_catalogos PRIMARY KEY (identificador),
    CONSTRAINT fk_catalogos_empleados FOREIGN KEY (responsable) REFERENCES empleados (identificador),
    CONSTRAINT fk_catalogos_subastas  FOREIGN KEY (subasta)     REFERENCES subastas  (identificador)
)
GO

CREATE TABLE itemsCatalogo (
    identificador   INT             NOT NULL IDENTITY,
    -- Numero de pieza o item dentro del catalogo
    numeroPieza     INT             NOT NULL,
    catalogo        INT             NOT NULL,
    producto        INT             NOT NULL,
    precioBase      DECIMAL(18,2)   NOT NULL CONSTRAINT chkPrecioBase CHECK (precioBase > 0.01),
    comision        DECIMAL(18,2)   NOT NULL CONSTRAINT chkComision   CHECK (comision   > 0.01),
    subastado       VARCHAR(2)      CONSTRAINT chkSubastado CHECK (subastado IN ('si', 'no')),
    CONSTRAINT pk_itemsCatalogo PRIMARY KEY (identificador),
    CONSTRAINT fk_itemsCatalogo_catalogos FOREIGN KEY (catalogo) REFERENCES catalogos (identificador),
    CONSTRAINT fk_itemsCatalogo_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
)
GO

CREATE TABLE asistentes (
    identificador   INT     NOT NULL IDENTITY,
    numeroPostor    INT     NOT NULL,
    cliente         INT     NOT NULL,
    subasta         INT     NOT NULL,
    -- Medio de pago que usa en esta subasta
    medioDePago     INT     NULL,
    CONSTRAINT pk_asistentes PRIMARY KEY (identificador),
    CONSTRAINT fk_asistentes_clientes    FOREIGN KEY (cliente)     REFERENCES clientes     (identificador),
    CONSTRAINT fk_asistentes_subastas    FOREIGN KEY (subasta)     REFERENCES subastas     (identificador),
    CONSTRAINT fk_asistentes_mediosPago  FOREIGN KEY (medioDePago) REFERENCES mediosDePago (identificador)
)
GO

CREATE TABLE pujos (
    identificador   INT             NOT NULL IDENTITY,
    asistente       INT             NOT NULL,
    item            INT             NOT NULL,
    importe         DECIMAL(18,2)   NOT NULL CONSTRAINT chkImportePujo CHECK (importe > 0.01),
    ganador         VARCHAR(2)      DEFAULT 'no' CONSTRAINT chkGanador CHECK (ganador IN ('si', 'no')),
    CONSTRAINT pk_pujos PRIMARY KEY (identificador),
    CONSTRAINT fk_pujos_asistentes    FOREIGN KEY (asistente) REFERENCES asistentes    (identificador),
    CONSTRAINT fk_pujos_itemsCatalogo FOREIGN KEY (item)      REFERENCES itemsCatalogo (identificador)
)
GO

CREATE TABLE registroDeSubasta (
    identificador   INT             NOT NULL IDENTITY,
    subasta         INT             NOT NULL,
    duenio          INT             NOT NULL,
    producto        INT             NOT NULL,
    cliente         INT             NOT NULL,
    importe         DECIMAL(18,2)   NOT NULL CONSTRAINT chkImportePagado  CHECK (importe  > 0.01),
    comision        DECIMAL(18,2)   NOT NULL CONSTRAINT chkComisionPagada CHECK (comision > 0.01),
    CONSTRAINT pk_registroDeSubasta PRIMARY KEY (identificador),
    CONSTRAINT fk_registroDeSubasta_subastas  FOREIGN KEY (subasta)  REFERENCES subastas  (identificador),
    CONSTRAINT fk_registroDeSubasta_duenios   FOREIGN KEY (duenio)   REFERENCES duenios   (identificador),
    CONSTRAINT fk_registroDeSubasta_productos FOREIGN KEY (producto) REFERENCES productos (identificador),
    CONSTRAINT fk_registroDeSubasta_clientes  FOREIGN KEY (cliente)  REFERENCES clientes  (identificador)
)
GO

-- TABLAS ADICIONALES PARA EL SISTEMA WEB/MOVIL

CREATE TABLE credenciales_web (
    identificador       INT             NOT NULL,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    passwordHash        VARCHAR(255)    NOT NULL,
    mustChangePassword  BIT             NOT NULL DEFAULT 1,
    CONSTRAINT pk_credenciales_web      PRIMARY KEY (identificador),
    CONSTRAINT fk_credenciales_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
)
GO

CREATE TABLE notificaciones_web (
    id                      INT             NOT NULL IDENTITY,
    identificadorPersona    INT             NOT NULL,
    mensaje                 VARCHAR(500)    NOT NULL,
    leido                   BIT             NOT NULL DEFAULT 0,
    fecha                   DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_notificaciones_web      PRIMARY KEY (id),
    CONSTRAINT fk_notificaciones_personas FOREIGN KEY (identificadorPersona) REFERENCES personas (identificador)
)
GO

-- DATOS DE PRUEBA

-- Paises
INSERT INTO paises (numero, nombre, nombreCorto, capital, nacionalidad, idiomas) VALUES
(1, 'Argentina',      'ARG', 'Buenos Aires', 'argentino/a',    'Español'),
(2, 'Brasil',         'BRA', 'Brasilia',     'brasileño/a',    'Portugues'),
(3, 'Uruguay',        'URU', 'Montevideo',   'uruguayo/a',     'Español'),
(4, 'Chile',          'CHI', 'Santiago',     'chileno/a',      'Español'),
(5, 'Estados Unidos', 'USA', 'Miami',        'estadounidense', 'Ingles')
GO

-- Personas
-- IDs 1-3: empleados | IDs 4-6: clientes | IDs 7-8: duenios | ID 9: subastador
SET IDENTITY_INSERT personas ON
GO
INSERT INTO personas (identificador, documento, nombre, direccion, estado) VALUES
(1, '20111111', 'Abril Martinez',  'Av. Corrientes 1234, CABA',   'activo'),
(2, '20222222', 'Melina Farao',    'San Martin 567, Cordoba',     'activo'),
(3, '20333333', 'Kevin Villalba',  'Rivadavia 890, Rosario',      'activo'),
(4, '20444444', 'Florencia Ayala', 'Belgrano 321, CABA',          'activo'),
(5, '20555555', 'Claudio Godio',   'Mitre 654, Mendoza',          'activo'),
(6, '20666666', 'Sofia Lopez',     'Sarmiento 987, La Plata',     'activo'),
(7, '20777777', 'Martin Perez',    'Libertad 111, CABA',          'activo'),
(8, '20888888', 'Lucia Sanchez',   'Maipu 222, Buenos Aires',     'activo'),
(9, '20999999', 'Roberto Diaz',    'Florida 333, CABA',           'activo')
GO
SET IDENTITY_INSERT personas OFF
GO

-- Empleados
INSERT INTO empleados (identificador, cargo, sector) VALUES
(1, 'Gerente General',    NULL),
(2, 'Revisora de Bienes', NULL),
(3, 'Verificador',        NULL)
GO

-- Sectores
INSERT INTO sectores (nombreSector, codigoSector, responsableSector) VALUES
('Administracion', 'ADM', 1),
('Operaciones',    'OPE', 2),
('Verificacion',   'VER', 3)
GO

-- Seguros
INSERT INTO seguros (nroPoliza, compania, polizaCombinada, importe) VALUES
('POL-001-2024', 'La Caja Seguros',  'si', 15000.00),
('POL-002-2024', 'Zurich Argentina', 'no',  8500.00),
('POL-003-2024', 'Sancor Seguros',   'si', 22000.00)
GO

-- Clientes (con URLs de placeholder para fotos de documento)
INSERT INTO clientes (identificador, numeroPais, admitido, categoria, verificador, fotoDocFrente, fotoDocDorso) VALUES
(4, 1, 'si', 'oro',      3, 'https://docs.subastas.com/clientes/4/doc-frente.jpg', 'https://docs.subastas.com/clientes/4/doc-dorso.jpg'),
(5, 1, 'si', 'comun',    3, 'https://docs.subastas.com/clientes/5/doc-frente.jpg', 'https://docs.subastas.com/clientes/5/doc-dorso.jpg'),
(6, 2, 'si', 'especial', 3, 'https://docs.subastas.com/clientes/6/doc-frente.jpg', 'https://docs.subastas.com/clientes/6/doc-dorso.jpg')
GO

-- Duenios
INSERT INTO duenios (identificador, numeroPais, verificacionFinanciera, verificacionJudicial, calificacionRiesgo, verificador) VALUES
(7, 1, 'si', 'si', 2, 3),
(8, 1, 'si', 'si', 1, 3)
GO

-- Subastadores
INSERT INTO subastadores (identificador, matricula, region) VALUES
(9, 'MAT-2024-001', 'Buenos Aires')
GO

-- Medios de pago
SET IDENTITY_INSERT mediosDePago ON
GO
INSERT INTO mediosDePago (identificador, cliente, tipo, moneda, verificado, activo) VALUES
(1, 4, 'cuenta_bancaria',  'pesos',   'si', 'si'),
(2, 4, 'tarjeta_credito',  'dolares', 'si', 'si'),
(3, 5, 'cheque',           'pesos',   'si', 'si'),
(4, 6, 'cuenta_bancaria',  'dolares', 'si', 'si')
GO
SET IDENTITY_INSERT mediosDePago OFF
GO

-- Cuentas bancarias
INSERT INTO cuentasBancarias (identificador, banco, nroCuenta, cbu, montoReservado) VALUES
(1, 'Banco Nacion Argentina', '0000-1234567890', '0110012345678901234567', 500000.00),
(4, 'Santander',              '0000-9876543210', '0720012345678901234567', 200000.00)
GO

-- Tarjetas de credito
INSERT INTO tarjetasCredito (identificador, numeroTarjeta, titular, vencimiento, red) VALUES
(2, '4111111111111111', 'Florencia Ayala', '12/2027', 'Visa')
GO

-- Cheques certificados
INSERT INTO chequesCertificados (identificador, nroCheque, banco, monto, montoDisponible, vencimiento) VALUES
(3, 'CHQ-001-2024', 'HSBC Argentina', 150000.00, 150000.00, DATEADD(dd, 90, GETDATE()))
GO

-- Subastas
INSERT INTO subastas (fecha, hora, estado, subastador, ubicacion, capacidadAsistentes, tieneDeposito, seguridadPropia, categoria, moneda) VALUES
(DATEADD(dd, 20, GETDATE()), '10:00', 'abierta', 9, 'Av. del Libertador 1000, CABA',  100, 'si', 'si', 'oro',      'pesos'),
(DATEADD(dd, 30, GETDATE()), '14:00', 'abierta', 9, 'Centro de Convenciones, Cordoba', 50, 'no', 'si', 'especial', 'pesos'),
(DATEADD(dd, 45, GETDATE()), '11:00', 'abierta', 9, 'Hotel Sheraton, Rosario',          80, 'si', 'si', 'platino',  'dolares')
GO

-- Productos (descripcionCompleta en NULL, el back la carga cuando sube el PDF)
INSERT INTO productos (fecha, disponible, descripcionCatalogo, descripcionCompleta, revisor, duenio, seguro) VALUES
(GETDATE(), 'si', 'Cuadro al oleo firmado, escuela impresionista argentina, circa 1940', NULL, 2, 7, 'POL-001-2024'),
(GETDATE(), 'si', 'Reloj de bolsillo suizo, oro 18k, mecanismo original funcionando',    NULL, 2, 7, 'POL-002-2024'),
(GETDATE(), 'si', 'Vajilla de porcelana francesa, 24 piezas, circa 1890, sin roturas',   NULL, 2, 8, 'POL-003-2024'),
(GETDATE(), 'si', 'Escultura en bronce, artista local reconocido, altura 45cm',          NULL, 2, 8, NULL)
GO

-- Catalogos
INSERT INTO catalogos (descripcion, subasta, responsable) VALUES
('Catalogo Subasta Obras de Arte - Junio 2026',   1, 1),
('Catalogo Subasta Antiguedades - Julio 2026',    2, 1),
('Catalogo Subasta Premium - Agosto 2026',        3, 1)
GO

-- Items del catalogo
INSERT INTO itemsCatalogo (numeroPieza, catalogo, producto, precioBase, comision, subastado) VALUES
(1, 1, 1, 50000.00, 5000.00, 'no'),
(2, 1, 2, 30000.00, 3000.00, 'no'),
(1, 2, 3, 25000.00, 2500.00, 'no'),
(1, 3, 4, 80000.00, 8000.00, 'no')
GO

-- Asistentes
INSERT INTO asistentes (numeroPostor, cliente, subasta, medioDePago) VALUES
(1, 4, 1, 1),
(2, 5, 1, 3),
(3, 6, 2, 4),
(4, 4, 3, 2)
GO

-- Credenciales web (password: 1234 para testing)
INSERT INTO credenciales_web (identificador, email, passwordHash, mustChangePassword) VALUES
(1, 'amartinez@subastas.com',  '1234', 0),
(2, 'mfarao@subastas.com',     '1234', 0),
(3, 'kvillalba@subastas.com',  '1234', 0),
(4, 'fayala@clientes.com',     '1234', 0),
(5, 'cgodio@clientes.com',     '1234', 0),
(7, 'mperez@duenios.com',      '1234', 0),
(9, 'rdiaz@subastadores.com',  '1234', 0)
GO

-- Notificaciones de prueba
INSERT INTO notificaciones_web (identificadorPersona, mensaje, leido) VALUES
(4, 'Su cuenta fue verificada exitosamente. Ya puede participar en subastas.', 0),
(5, 'Hay una nueva subasta disponible para su categoria.',                      0),
(7, 'Su producto fue revisado y aprobado para el catalogo.',                    1),
(4, 'La subasta en la que participa comienza en 48hs.',                         0)
GO

-- VERIFICACION FINAL

SELECT TABLE_NAME AS Tabla
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME
GO
