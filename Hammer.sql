create database HammerSubastas
go

use HammerSubastas
go

-- ============================================================
--  HAMMER Subastas - Estructura completa de base de datos
--  SQL Server Express
--  TABLAS DEL PROFESOR: sin ninguna modificacion
--  TABLAS EXTRA: prefijo "extra_", agregadas por el grupo
-- ============================================================

-- TABLAS DEL PROFESOR

create table paises(
	numero int not null,
	nombre varchar(250) not null,
	nombreCorto varchar(250) null,
	capital varchar(250) not null,
	nacionalidad varchar(250) not null,
	idiomas varchar(150) not null,
	constraint pk_paises primary key (numero)
)
go

create table personas(
	identificador int not null identity,
	documento varchar(20) not null,
	nombre varchar(150) not null,
	direccion varchar(250),
	estado varchar(15) constraint chkEstado check (estado in ('activo', 'inactivo')), -- typo 'incativo' corregido, autorizado por el profesor
	foto varbinary(max),
	constraint pk_personas primary key (identificador)
)
go

create table empleados(
	identificador int not null,
	cargo varchar(100),
	sector int null,
	constraint pk_empleados primary key (identificador)
)
go

create table sectores(
	identificador int not null identity,
	nombreSector varchar(150) not null,
	codigoSector varchar(10) null,
	responsableSector int null,
	constraint pk_sectores primary key (identificador),
	constraint fk_sectores_empleados foreign key (responsableSector) references empleados
)
go

create table seguros(
	nroPoliza varchar(30) not null,
	compania varchar(150) not null,
	polizaCombinada varchar(2) constraint chkpolizaCombinada check(polizaCombinada in ('si','no')),
	importe decimal(18,2) not null constraint chkImporte check (importe > 0),
	constraint pk_seguro primary key (nroPoliza)
)
go

create table clientes(
	identificador int not null,
	numeroPais int,
	admitido varchar(2) constraint chkAdmitido check(admitido in ('si','no')),
	categoria varchar(10) constraint chkCategoria check (categoria in ('comun', 'especial', 'plata', 'oro', 'platino')),
	verificador int not null,
	constraint pk_clientes primary key (identificador),
	constraint fk_clientes_personas foreign key (identificador) references personas,
	constraint fk_clientes_empleados foreign key (verificador) references empleados (identificador),
	constraint fk_clientes_paises foreign key (numeroPais) references paises (numero)
)
go

create table duenios(
	identificador int not null,
	numeroPais int,
	verificacionFinanciera varchar(2) constraint chkVF check(verificacionFinanciera in ('si','no')),
	verificacionJudicial varchar(2) constraint chkVJ check(verificacionJudicial in ('si','no')),
	calificacionRiesgo int constraint chkCR check(calificacionRiesgo in (1,2,3,4,5,6)),
	verificador int not null,
	constraint pk_duenios primary key (identificador),
	constraint fk_duenios_personas foreign key (identificador) references personas,
	constraint fk_duenios_empleados foreign key (verificador) references empleados (identificador)
)
go

create table subastadores(
	identificador int not null,
	matricula varchar(15),
	region varchar(50),
	constraint pk_subastadores primary key (identificador),
	constraint fk_subastadores_personas foreign key (identificador) references personas
)
go

create table subastas(
	identificador int not null identity,
	fecha date constraint chkFecha check (fecha > dateAdd(dd, 10, getdate())), -- min 10 dias de anticipacion
	hora time not null,
	estado varchar(10) constraint chkES check (estado in ('abierta','carrada')),
	subastador int null,
	ubicacion varchar(350) null,
	capacidadAsistentes int null,
	tieneDeposito varchar(2) constraint chkTD check(tieneDeposito in ('si','no')),
	seguridadPropia varchar(2) constraint chkSP check(seguridadPropia in ('si','no')),
	categoria varchar(10) constraint chkCS check (categoria in ('comun', 'especial', 'plata', 'oro', 'platino')),
	constraint pk_subastas primary key (identificador),
	constraint fk_subastas_subastadores foreign key (subastador) references subastadores(identificador)
)
go

create table productos(
	identificador int not null identity,
	fecha date,
	disponible varchar(2) constraint chkD check (disponible in ('si','no')),
	descripcionCatalogo varchar(500) null default 'No Posee', -- se completa tras revision del empleado
	descripcionCompleta varchar(300) not null, -- url a PDF firmado con descripcion del producto
	revisor int not null,
	duenio int not null,
	seguro varchar(30) null,
	constraint pk_productos primary key (identificador),
	constraint fk_productos_empleados foreign key (revisor) references empleados(identificador),
	constraint fk_productos_duenios foreign key (duenio) references duenios(identificador),
	-- FK autorizada por el profesor Godio (omision en el script original)
	constraint fk_productos_seguros foreign key (seguro) references seguros(nroPoliza)
)
go

create table fotos(
	identificador int not null identity,
	producto int not null,
	foto varbinary(max) not null,
	constraint pk_fotos primary key (identificador),
	constraint fk_fotos_productos foreign key (producto) references productos(identificador)
)
go

create table catalogos(
	identificador int not null identity,
	descripcion varchar(250) not null,
	subasta int null,
	responsable int not null,
	constraint pk_catalogos primary key (identificador),
	constraint fk_catalogos_empleados foreign key (responsable) references empleados(identificador),
	constraint fk_catalogos_subastas foreign key (subasta) references subastas(identificador)
)
go

create table itemsCatalogo(
	identificador int not null identity,
	catalogo int not null,
	producto int not null,
	precioBase decimal(18,2) not null constraint chkPB check (precioBase > 0.01),
	comision decimal(18,2) not null constraint chkC check (comision > 0.01),
	subastado varchar(2) constraint chkS check (subastado in ('si','no')),
	constraint pk_itemsCatalogo primary key (identificador),
	constraint fk_itemsCatalogo_catalogos foreign key (catalogo) references catalogos,
	constraint fk_itemsCatalogo_productos foreign key (producto) references productos
)
go

create table asistentes(
	identificador int not null identity,
	numeroPostor int not null,
	cliente int not null,
	subasta int not null,
	constraint pk_asistentes primary key (identificador),
	constraint fk_asistentes_clientes foreign key (cliente) references clientes,
	constraint fk_asistentes_subasta foreign key (subasta) references subastas
)
go

create table pujos(
	identificador int not null identity,
	asistente int not null,
	item int not null,
	importe decimal(18,2) not null constraint chkI check (importe > 0.01),
	ganador varchar(2) constraint chkG check (ganador in ('si','no')) default 'no',
	constraint pk_pujos primary key (identificador),
	constraint fk_pujos_asistentes foreign key (asistente) references asistentes,
	constraint fk_pujos_itemsCatalogo foreign key (item) references itemsCatalogo
)
go

create table registroDeSubasta(
	identificador int not null identity,
	subasta int not null,
	duenio int not null,
	producto int not null,
	cliente int not null,
	importe decimal(18,2) not null constraint chkImportePagado check (importe > 0.01),
	comision decimal(18,2) not null constraint chkComisionPagada check (comision > 0.01),
	constraint pk_registroDeSubasta primary key (identificador),
	constraint fk_registroDeSubasta_subastas foreign key (subasta) references subastas,
	constraint fk_registroDeSubasta_duenios foreign key (duenio) references duenios,
	constraint fk_registroDeSubasta_producto foreign key (producto) references productos,
	constraint fk_registroDeSubasta_cliente foreign key (cliente) references clientes
)
go

-- ============================================================
--  TABLAS EXTRA DEL GRUPO — prefijo "extra_"
--  Complementan la estructura del profesor sin modificarla.
--  Todas referencian tablas originales via FK.
-- ============================================================

-- extra_credencialesCliente: personas no tiene email ni contrasena.
-- estadoCredencial controla el ciclo de vida del registro:
--   pendiente  -> recien registrado, mail sin verificar
--   validado   -> verificado por la empresa, se envia contrasena temporal automaticamente
--   activo     -> usuario eligio su propia clave, acceso completo
--   rechazado  -> empresa rechazo al usuario, se envia mail general de rechazo
--   inactivo   -> personas.estado paso a 'inactivo', mail de desactivacion ya enviado (evita reenvio)
-- debeCambiarClave 'si' = usa clave por defecto, 'no' = eligio su propia clave.
-- Ref: clientes(identificador)
create table extra_credencialesCliente(
	identificador      int          not null identity,
	cliente            int          not null,
	email              varchar(200) not null,
	passwordHash       varchar(500) not null,
	estadoCredencial   varchar(20)  not null default 'pendiente'
		constraint chkEstadoCredencial check (estadoCredencial in ('pendiente','validado','activo','rechazado','inactivo')),
	debeCambiarClave   varchar(2)   not null default 'si'
		constraint chkDebeCambiarClave check (debeCambiarClave in ('si','no')),
	mailEnviado        bit          not null default 0, -- false = mail no enviado, true = mail enviado
	fechaRegistro      date         not null default getdate(), -- usado como 'miembro desde' en el perfil
	constraint pk_extra_credencialesCliente primary key (identificador),
	constraint uq_extra_credencialesCliente_email unique (email),
	constraint fk_extra_credencialesCliente_clientes
		foreign key (cliente) references clientes(identificador)
)
go

-- extra_documentosCliente: personas tiene una sola columna foto.
-- El registro exige frente Y dorso del documento por separado.
-- Ref: clientes(identificador)
create table extra_documentosCliente(
	identificador int            not null identity,
	cliente       int            not null,
	fotoFrente    varbinary(max) not null,
	fotoDorso     varbinary(max) not null,
	constraint pk_extra_documentosCliente primary key (identificador),
	constraint fk_extra_documentosCliente_clientes
		foreign key (cliente) references clientes(identificador)
)
go

-- extra_metodosPago: no existe tabla de medios de pago en el esquema original.
-- Solo metodos con estado 'verificado' pueden usarse en una puja.
-- Estados: pendiente -> verificado -> rechazado
-- Ref: clientes(identificador)
create table extra_metodosPago(
	identificador int         not null identity,
	cliente       int         not null,
	tipo          varchar(20) not null
		constraint chkTipoMetodo check (tipo in ('tarjeta','cheque','transferencia')),
	numero        varchar(50) not null,
	vencimiento   varchar(7)  null, -- solo tarjetas (MM/YYYY)
	cvv           varchar(4)  null, -- solo tarjetas
	estado        varchar(20) not null default 'pendiente'
		constraint chkEstadoMetodo check (estado in ('pendiente','verificado','rechazado')),
	constraint pk_extra_metodosPago primary key (identificador),
	constraint fk_extra_metodosPago_clientes
		foreign key (cliente) references clientes(identificador)
)
go

-- extra_subastas: subastas no tiene titulo ni descripcion.
-- fechaFin: para el cierre automatico de subastas desde el backend.
-- Ref: subastas(identificador)
create table extra_subastas(
	identificador int          not null identity,
	subasta       int          not null,
	titulo        varchar(200) not null,
	descripcion   varchar(500) null,
	fechaFin      datetime2    null,
	constraint pk_extra_subastas primary key (identificador),
	constraint fk_extra_subastas_subastas
		foreign key (subasta) references subastas(identificador)
)
go

-- notificaciones: eventos del sistema que el usuario ve en la campanita de la app.
-- Se generan automaticamente desde el backend cuando ocurren eventos importantes.
-- leido: BIT (0 = no leido, 1 = leido)
-- Ref: personas(identificador)
create table notificaciones(
	id                   int          not null identity,
	identificadorPersona int          not null,
	mensaje              varchar(500) not null,
	leido                bit          not null default 0,
	fecha                datetime2    not null default getdate(),
	constraint pk_notificaciones primary key (id),
	constraint fk_notificaciones_personas
		foreign key (identificadorPersona) references personas(identificador)
)
go
