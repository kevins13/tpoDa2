-- SISTEMA DE SUBASTAS - TPO_HAMMER
-- Script adaptado para PostgreSQL: estructura + datos de prueba

-- Eliminar tablas si existen para poder ejecutar el script varias veces
DROP TABLE IF EXISTS notificaciones_web CASCADE;
DROP TABLE IF EXISTS credenciales_web CASCADE;
DROP TABLE IF EXISTS registroDeSubasta CASCADE;
DROP TABLE IF EXISTS pujos CASCADE;
DROP TABLE IF EXISTS asistentes CASCADE;
DROP TABLE IF EXISTS itemsCatalogo CASCADE;
DROP TABLE IF EXISTS catalogos CASCADE;
DROP TABLE IF EXISTS fotos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS subastas CASCADE;
DROP TABLE IF EXISTS chequesCertificados CASCADE;
DROP TABLE IF EXISTS tarjetasCredito CASCADE;
DROP TABLE IF EXISTS cuentasBancarias CASCADE;
DROP TABLE IF EXISTS mediosDePago CASCADE;
DROP TABLE IF EXISTS subastadores CASCADE;
DROP TABLE IF EXISTS duenios CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS seguros CASCADE;
DROP TABLE IF EXISTS sectores CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS paises CASCADE;

CREATE TABLE paises (
    numero          INT             NOT NULL,
    nombre          VARCHAR(250)    NOT NULL,
    nombreCorto     VARCHAR(250)    NULL,
    capital         VARCHAR(250)    NOT NULL,
    nacionalidad    VARCHAR(250)    NOT NULL,
    idiomas         VARCHAR(150)    NOT NULL,
    CONSTRAINT pk_paises PRIMARY KEY (numero)
);

CREATE TABLE personas (
    identificador   SERIAL          NOT NULL,
    documento       VARCHAR(20)     NOT NULL,
    nombre          VARCHAR(150)    NOT NULL,
    direccion       VARCHAR(250)    NULL,
    estado          VARCHAR(15)     CONSTRAINT chkEstado CHECK (estado IN ('activo', 'inactivo')),
    foto            BYTEA           NULL,
    CONSTRAINT pk_personas PRIMARY KEY (identificador)
);

CREATE TABLE empleados (
    identificador   INT             NOT NULL,
    cargo           VARCHAR(100)    NULL,
    sector          INT             NULL,
    CONSTRAINT pk_empleados PRIMARY KEY (identificador)
);

CREATE TABLE sectores (
    identificador       SERIAL          NOT NULL,
    nombreSector        VARCHAR(150)    NOT NULL,
    codigoSector        VARCHAR(10)     NULL,
    responsableSector   INT             NULL,
    CONSTRAINT pk_sectores PRIMARY KEY (identificador),
    CONSTRAINT fk_sectores_empleados FOREIGN KEY (responsableSector) REFERENCES empleados (identificador)
);

CREATE TABLE seguros (
    nroPoliza           VARCHAR(30)     NOT NULL,
    compania            VARCHAR(150)    NOT NULL,
    polizaCombinada     VARCHAR(2)      CONSTRAINT chkPolizaCombinada CHECK (polizaCombinada IN ('si', 'no')),
    importe             DECIMAL(18,2)   NOT NULL CONSTRAINT chkImporte CHECK (importe > 0),
    CONSTRAINT pk_seguros PRIMARY KEY (nroPoliza)
);

CREATE TABLE clientes (
    identificador       INT         NOT NULL,
    numeroPais          INT         NULL,
    admitido            VARCHAR(2)  CONSTRAINT chkAdmitido CHECK (admitido IN ('si', 'no')),
    categoria           VARCHAR(10) CONSTRAINT chkCategoria CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino')),
    verificador         INT         NOT NULL,
    fotoDocFrente       VARCHAR(300) NULL,
    fotoDocDorso        VARCHAR(300) NULL,
    CONSTRAINT pk_clientes PRIMARY KEY (identificador),
    CONSTRAINT fk_clientes_personas  FOREIGN KEY (identificador) REFERENCES personas (identificador),
    CONSTRAINT fk_clientes_empleados FOREIGN KEY (verificador)   REFERENCES empleados (identificador),
    CONSTRAINT fk_clientes_paises    FOREIGN KEY (numeroPais)    REFERENCES paises (numero)
);

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
);

CREATE TABLE subastadores (
    identificador   INT             NOT NULL,
    matricula       VARCHAR(15)     NULL,
    region          VARCHAR(50)     NULL,
    CONSTRAINT pk_subastadores PRIMARY KEY (identificador),
    CONSTRAINT fk_subastadores_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
);

CREATE TABLE mediosDePago (
    identificador   SERIAL          NOT NULL,
    cliente         INT             NOT NULL,
    tipo            VARCHAR(20)     NOT NULL CONSTRAINT chkTipoMedio CHECK (tipo IN ('cuenta_bancaria', 'tarjeta_credito', 'cheque')),
    moneda          VARCHAR(10)     NOT NULL CONSTRAINT chkMonedaMedio CHECK (moneda IN ('pesos', 'dolares')),
    verificado      VARCHAR(2)      NOT NULL DEFAULT 'no' CONSTRAINT chkVerificado CHECK (verificado IN ('si', 'no')),
    activo          VARCHAR(2)      NOT NULL DEFAULT 'si' CONSTRAINT chkActivoMedio CHECK (activo IN ('si', 'no')),
    CONSTRAINT pk_mediosDePago PRIMARY KEY (identificador),
    CONSTRAINT fk_mediosDePago_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador)
);

CREATE TABLE cuentasBancarias (
    identificador   INT             NOT NULL,
    banco           VARCHAR(150)    NOT NULL,
    nroCuenta       VARCHAR(50)     NOT NULL,
    cbu             VARCHAR(22)     NULL,
    swift           VARCHAR(11)     NULL,
    montoReservado  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    CONSTRAINT pk_cuentasBancarias PRIMARY KEY (identificador),
    CONSTRAINT fk_cuentasBancarias_medios FOREIGN KEY (identificador) REFERENCES mediosDePago (identificador)
);

CREATE TABLE tarjetasCredito (
    identificador   INT             NOT NULL,
    numeroTarjeta   VARCHAR(20)     NOT NULL,
    titular         VARCHAR(150)    NOT NULL,
    vencimiento     VARCHAR(7)      NOT NULL,
    red             VARCHAR(30)     NOT NULL,
    CONSTRAINT pk_tarjetasCredito PRIMARY KEY (identificador),
    CONSTRAINT fk_tarjetasCredito_medios FOREIGN KEY (identificador) REFERENCES mediosDePago (identificador)
);

CREATE TABLE chequesCertificados (
    identificador   INT             NOT NULL,
    nroCheque       VARCHAR(30)     NOT NULL,
    banco           VARCHAR(150)    NOT NULL,
    monto           DECIMAL(18,2)   NOT NULL CONSTRAINT chkMontoCheque CHECK (monto > 0),
    montoDisponible DECIMAL(18,2)   NOT NULL,
    vencimiento     DATE            NOT NULL,
    CONSTRAINT pk_chequesCertificados PRIMARY KEY (identificador),
    CONSTRAINT fk_chequesCertificados_medios FOREIGN KEY (identificador) REFERENCES mediosDePago (identificador)
);

CREATE TABLE subastas (
    identificador       SERIAL          NOT NULL,
    fecha               DATE            CONSTRAINT chkFecha CHECK (fecha > CURRENT_DATE + INTERVAL '10 days'),
    hora                TIME            NOT NULL,
    estado              VARCHAR(10)     CONSTRAINT chkEstadoSubasta CHECK (estado IN ('abierta', 'cerrada')),
    subastador          INT             NULL,
    ubicacion           VARCHAR(350)    NULL,
    capacidadAsistentes INT             NULL,
    tieneDeposito       VARCHAR(2)      CONSTRAINT chkTieneDeposito   CHECK (tieneDeposito   IN ('si', 'no')),
    seguridadPropia     VARCHAR(2)      CONSTRAINT chkSeguridadPropia CHECK (seguridadPropia IN ('si', 'no')),
    categoria           VARCHAR(10)     CONSTRAINT chkCategoriaSubasta CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino')),
    moneda              VARCHAR(10)     NOT NULL DEFAULT 'pesos' CONSTRAINT chkMoneda CHECK (moneda IN ('pesos', 'dolares')),
    CONSTRAINT pk_subastas PRIMARY KEY (identificador),
    CONSTRAINT fk_subastas_subastadores FOREIGN KEY (subastador) REFERENCES subastadores (identificador)
);

CREATE TABLE productos (
    identificador       SERIAL          NOT NULL,
    fecha               DATE            NULL,
    disponible          VARCHAR(2)      CONSTRAINT chkDisponible CHECK (disponible IN ('si', 'no')),
    descripcionCatalogo VARCHAR(500)    NULL DEFAULT 'No Posee',
    descripcionCompleta VARCHAR(300)    NULL,
    revisor             INT             NOT NULL,
    duenio              INT             NOT NULL,
    seguro              VARCHAR(30)     NULL,
    CONSTRAINT pk_productos PRIMARY KEY (identificador),
    CONSTRAINT fk_productos_empleados FOREIGN KEY (revisor) REFERENCES empleados (identificador),
    CONSTRAINT fk_productos_duenios   FOREIGN KEY (duenio)  REFERENCES duenios   (identificador),
    CONSTRAINT fk_productos_seguros   FOREIGN KEY (seguro)  REFERENCES seguros   (nroPoliza)
);

CREATE TABLE fotos (
    identificador   SERIAL          NOT NULL,
    producto        INT             NOT NULL,
    foto            BYTEA           NOT NULL,
    CONSTRAINT pk_fotos PRIMARY KEY (identificador),
    CONSTRAINT fk_fotos_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

CREATE TABLE catalogos (
    identificador   SERIAL          NOT NULL,
    descripcion     VARCHAR(250)    NOT NULL,
    subasta         INT             NULL,
    responsable     INT             NOT NULL,
    CONSTRAINT pk_catalogos PRIMARY KEY (identificador),
    CONSTRAINT fk_catalogos_empleados FOREIGN KEY (responsable) REFERENCES empleados (identificador),
    CONSTRAINT fk_catalogos_subastas  FOREIGN KEY (subasta)     REFERENCES subastas  (identificador)
);

CREATE TABLE itemsCatalogo (
    identificador   SERIAL          NOT NULL,
    numeroPieza     INT             NOT NULL,
    catalogo        INT             NOT NULL,
    producto        INT             NOT NULL,
    precioBase      DECIMAL(18,2)   NOT NULL CONSTRAINT chkPrecioBase CHECK (precioBase > 0.01),
    comision        DECIMAL(18,2)   NOT NULL CONSTRAINT chkComision   CHECK (comision   > 0.01),
    subastado       VARCHAR(2)      CONSTRAINT chkSubastado CHECK (subastado IN ('si', 'no')),
    CONSTRAINT pk_itemsCatalogo PRIMARY KEY (identificador),
    CONSTRAINT fk_itemsCatalogo_catalogos FOREIGN KEY (catalogo) REFERENCES catalogos (identificador),
    CONSTRAINT fk_itemsCatalogo_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

CREATE TABLE asistentes (
    identificador   SERIAL  NOT NULL,
    numeroPostor    INT     NOT NULL,
    cliente         INT     NOT NULL,
    subasta         INT     NOT NULL,
    medioDePago     INT     NULL,
    CONSTRAINT pk_asistentes PRIMARY KEY (identificador),
    CONSTRAINT fk_asistentes_clientes    FOREIGN KEY (cliente)     REFERENCES clientes     (identificador),
    CONSTRAINT fk_asistentes_subastas    FOREIGN KEY (subasta)     REFERENCES subastas     (identificador),
    CONSTRAINT fk_asistentes_mediosPago  FOREIGN KEY (medioDePago) REFERENCES mediosDePago (identificador)
);

CREATE TABLE pujos (
    identificador   SERIAL          NOT NULL,
    asistente       INT             NOT NULL,
    item            INT             NOT NULL,
    importe         DECIMAL(18,2)   NOT NULL CONSTRAINT chkImportePujo CHECK (importe > 0.01),
    ganador         VARCHAR(2)      DEFAULT 'no' CONSTRAINT chkGanador CHECK (ganador IN ('si', 'no')),
    CONSTRAINT pk_pujos PRIMARY KEY (identificador),
    CONSTRAINT fk_pujos_asistentes    FOREIGN KEY (asistente) REFERENCES asistentes    (identificador),
    CONSTRAINT fk_pujos_itemsCatalogo FOREIGN KEY (item)      REFERENCES itemsCatalogo (identificador)
);

CREATE TABLE registroDeSubasta (
    identificador   SERIAL          NOT NULL,
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
);

CREATE TABLE credenciales_web (
    identificador       INT             NOT NULL,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    passwordHash        VARCHAR(255)    NOT NULL,
    mustChangePassword  BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_credenciales_web      PRIMARY KEY (identificador),
    CONSTRAINT fk_credenciales_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
);

CREATE TABLE notificaciones_web (
    id                      SERIAL          NOT NULL,
    identificadorPersona    INT             NOT NULL,
    mensaje                 VARCHAR(500)    NOT NULL,
    leido                   BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha                   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_notificaciones_web      PRIMARY KEY (id),
    CONSTRAINT fk_notificaciones_personas FOREIGN KEY (identificadorPersona) REFERENCES personas (identificador)
);

-- DATOS DE PRUEBA

INSERT INTO paises (numero, nombre, nombreCorto, capital, nacionalidad, idiomas) VALUES
(1, 'Argentina',      'ARG', 'Buenos Aires', 'argentino/a',    'Español'),
(2, 'Brasil',         'BRA', 'Brasilia',     'brasileño/a',    'Portugues'),
(3, 'Uruguay',        'URU', 'Montevideo',   'uruguayo/a',     'Español'),
(4, 'Chile',          'CHI', 'Santiago',     'chileno/a',      'Español'),
(5, 'Estados Unidos', 'USA', 'Miami',        'estadounidense', 'Ingles');

INSERT INTO personas (identificador, documento, nombre, direccion, estado) VALUES
(1, '20111111', 'Abril Martinez',  'Av. Corrientes 1234, CABA',   'activo'),
(2, '20222222', 'Melina Farao',    'San Martin 567, Cordoba',     'activo'),
(3, '20333333', 'Kevin Villalba',  'Rivadavia 890, Rosario',      'activo'),
(4, '20444444', 'Florencia Ayala', 'Belgrano 321, CABA',          'activo'),
(5, '20555555', 'Claudio Godio',   'Mitre 654, Mendoza',          'activo'),
(6, '20666666', 'Sofia Lopez',     'Sarmiento 987, La Plata',     'activo'),
(7, '20777777', 'Martin Perez',    'Libertad 111, CABA',          'activo'),
(8, '20888888', 'Lucia Sanchez',   'Maipu 222, Buenos Aires',     'activo'),
(9, '20999999', 'Roberto Diaz',    'Florida 333, CABA',           'activo');

SELECT setval('personas_identificador_seq', (SELECT MAX(identificador) FROM personas));

INSERT INTO empleados (identificador, cargo, sector) VALUES
(1, 'Gerente General',    NULL),
(2, 'Revisora de Bienes', NULL),
(3, 'Verificador',        NULL);

INSERT INTO sectores (nombreSector, codigoSector, responsableSector) VALUES
('Administracion', 'ADM', 1),
('Operaciones',    'OPE', 2),
('Verificacion',   'VER', 3);

INSERT INTO seguros (nroPoliza, compania, polizaCombinada, importe) VALUES
('POL-001-2024', 'La Caja Seguros',  'si', 15000.00),
('POL-002-2024', 'Zurich Argentina', 'no',  8500.00),
('POL-003-2024', 'Sancor Seguros',   'si', 22000.00);

INSERT INTO clientes (identificador, numeroPais, admitido, categoria, verificador, fotoDocFrente, fotoDocDorso) VALUES
(4, 1, 'si', 'oro',      3, 'https://docs.subastas.com/clientes/4/doc-frente.jpg', 'https://docs.subastas.com/clientes/4/doc-dorso.jpg'),
(5, 1, 'si', 'comun',    3, 'https://docs.subastas.com/clientes/5/doc-frente.jpg', 'https://docs.subastas.com/clientes/5/doc-dorso.jpg'),
(6, 2, 'si', 'especial', 3, 'https://docs.subastas.com/clientes/6/doc-frente.jpg', 'https://docs.subastas.com/clientes/6/doc-dorso.jpg');

INSERT INTO duenios (identificador, numeroPais, verificacionFinanciera, verificacionJudicial, calificacionRiesgo, verificador) VALUES
(7, 1, 'si', 'si', 2, 3),
(8, 1, 'si', 'si', 1, 3);

INSERT INTO subastadores (identificador, matricula, region) VALUES
(9, 'MAT-2024-001', 'Buenos Aires');

INSERT INTO mediosDePago (identificador, cliente, tipo, moneda, verificado, activo) VALUES
(1, 4, 'cuenta_bancaria',  'pesos',   'si', 'si'),
(2, 4, 'tarjeta_credito',  'dolares', 'si', 'si'),
(3, 5, 'cheque',           'pesos',   'si', 'si'),
(4, 6, 'cuenta_bancaria',  'dolares', 'si', 'si');

SELECT setval('mediosdepago_identificador_seq', (SELECT MAX(identificador) FROM mediosDePago));

INSERT INTO cuentasBancarias (identificador, banco, nroCuenta, cbu, montoReservado) VALUES
(1, 'Banco Nacion Argentina', '0000-1234567890', '0110012345678901234567', 500000.00),
(4, 'Santander',              '0000-9876543210', '0720012345678901234567', 200000.00);

INSERT INTO tarjetasCredito (identificador, numeroTarjeta, titular, vencimiento, red) VALUES
(2, '4111111111111111', 'Florencia Ayala', '12/2027', 'Visa');

INSERT INTO chequesCertificados (identificador, nroCheque, banco, monto, montoDisponible, vencimiento) VALUES
(3, 'CHQ-001-2024', 'HSBC Argentina', 150000.00, 150000.00, CURRENT_DATE + INTERVAL '90 days');

INSERT INTO subastas (identificador, fecha, hora, estado, subastador, ubicacion, capacidadAsistentes, tieneDeposito, seguridadPropia, categoria, moneda) VALUES
(1, CURRENT_DATE + INTERVAL '20 days', '10:00', 'abierta', 9, 'Av. del Libertador 1000, CABA',  100, 'si', 'si', 'oro',      'pesos'),
(2, CURRENT_DATE + INTERVAL '30 days', '14:00', 'abierta', 9, 'Centro de Convenciones, Cordoba', 50, 'no', 'si', 'especial', 'pesos'),
(3, CURRENT_DATE + INTERVAL '45 days', '11:00', 'abierta', 9, 'Hotel Sheraton, Rosario',          80, 'si', 'si', 'platino',  'dolares');

SELECT setval('subastas_identificador_seq', (SELECT MAX(identificador) FROM subastas));

INSERT INTO productos (identificador, fecha, disponible, descripcionCatalogo, descripcionCompleta, revisor, duenio, seguro) VALUES
(1, CURRENT_DATE, 'si', 'Cuadro al oleo firmado, escuela impresionista argentina, circa 1940', NULL, 2, 7, 'POL-001-2024'),
(2, CURRENT_DATE, 'si', 'Reloj de bolsillo suizo, oro 18k, mecanismo original funcionando',    NULL, 2, 7, 'POL-002-2024'),
(3, CURRENT_DATE, 'si', 'Vajilla de porcelana francesa, 24 piezas, circa 1890, sin roturas',   NULL, 2, 8, 'POL-003-2024'),
(4, CURRENT_DATE, 'si', 'Escultura en bronce, artista local reconocido, altura 45cm',          NULL, 2, 8, NULL);

SELECT setval('productos_identificador_seq', (SELECT MAX(identificador) FROM productos));

INSERT INTO catalogos (identificador, descripcion, subasta, responsable) VALUES
(1, 'Catalogo Subasta Obras de Arte - Junio 2026',   1, 1),
(2, 'Catalogo Subasta Antiguedades - Julio 2026',    2, 1),
(3, 'Catalogo Subasta Premium - Agosto 2026',        3, 1);

SELECT setval('catalogos_identificador_seq', (SELECT MAX(identificador) FROM catalogos));

INSERT INTO itemsCatalogo (numeroPieza, catalogo, producto, precioBase, comision, subastado) VALUES
(1, 1, 1, 50000.00, 5000.00, 'no'),
(2, 1, 2, 30000.00, 3000.00, 'no'),
(1, 2, 3, 25000.00, 2500.00, 'no'),
(1, 3, 4, 80000.00, 8000.00, 'no');

INSERT INTO asistentes (numeroPostor, cliente, subasta, medioDePago) VALUES
(1, 4, 1, 1),
(2, 5, 1, 3),
(3, 6, 2, 4),
(4, 4, 3, 2);

INSERT INTO credenciales_web (identificador, email, passwordHash, mustChangePassword) VALUES
(1, 'amartinez@subastas.com',  '1234', false),
(2, 'mfarao@subastas.com',     '1234', false),
(3, 'kvillalba@subastas.com',  '1234', false),
(4, 'fayala@clientes.com',     '1234', false),
(5, 'cgodio@clientes.com',     '1234', false),
(7, 'mperez@duenios.com',      '1234', false),
(9, 'rdiaz@subastadores.com',  '1234', false);

INSERT INTO notificaciones_web (identificadorPersona, mensaje, leido) VALUES
(4, 'Su cuenta fue verificada exitosamente. Ya puede participar en subastas.', false),
(5, 'Hay una nueva subasta disponible para su categoria.',                      false),
(7, 'Su producto fue revisado y aprobado para el catalogo.',                    true),
(4, 'La subasta en la que participa comienza en 48hs.',                         false);
