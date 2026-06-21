import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // ─── 1. LIMPIEZA (respeta orden de FK) ──────────────────────────────────
  // ⚠️ No se tocan paises — se cargan aparte con paises.sql
  await prisma.notificaciones.deleteMany();
  await prisma.extra_metodosPago.deleteMany();
  await prisma.extra_documentosCliente.deleteMany();
  await prisma.extra_credencialesCliente.deleteMany();
  await prisma.extra_subastas.deleteMany();
  await prisma.pujos.deleteMany();
  await prisma.asistentes.deleteMany();
  await prisma.registroDeSubasta.deleteMany();
  await prisma.itemsCatalogo.deleteMany();
  await prisma.catalogos.deleteMany();
  await prisma.subastas.deleteMany();
  await prisma.subastadores.deleteMany();
  await prisma.fotos.deleteMany();
  await prisma.productos.deleteMany();
  await prisma.duenios.deleteMany();
  await prisma.clientes.deleteMany();
  await prisma.empleados.deleteMany();
  await prisma.sectores.deleteMany();
  await prisma.personas.deleteMany();
  await prisma.seguros.deleteMany();

  console.log('Tablas limpiadas.');

  // ─── 2. RESET IDENTIDAD personas ────────────────────────────────────────
  // Garantiza que el primer empleado reciba identificador=1.
  // auth.service.ts tiene EMPLEADO_DEFAULT = 1 hardcodeado como verificador de clientes.
  await prisma.$queryRawUnsafe(`ALTER SEQUENCE personas_identificador_seq RESTART WITH 1`);

  // ─── 3. SECTORES Y SEGURO BASE ──────────────────────────────────────────
  const sectorAdmin = await prisma.sectores.create({
    data: { nombreSector: 'Administración', codigoSector: 'ADM' },
  });
  const sectorSubastadores = await prisma.sectores.create({
    data: { nombreSector: 'Subastadores', codigoSector: 'SUB' },
  });

  await prisma.seguros.create({
    data: {
      nroPoliza: 'POL-HAMMER-001',
      compania: 'Zurich Seguros',
      polizaCombinada: 'si',
      importe: 100000.0,
    },
  });

  // ─── 4. EMPLEADO ADMINISTRADOR (identificador = 1 tras DBCC CHECKIDENT) ─
  const personaAdmin = await prisma.personas.create({
    data: {
      documento: '00000001',
      nombre: 'Administrador Sistema',
      estado: 'activo',
    },
  });
  const empleadoAdmin = await prisma.empleados.create({
    data: {
      identificador: personaAdmin.identificador,
      cargo: 'Administrador',
      sector: sectorAdmin.identificador,
    },
  });
  console.log(`Empleado admin → identificador=${personaAdmin.identificador} (debe ser 1)`);

  // ─── 5. SUBASTADOR ──────────────────────────────────────────────────────
  const personaSubastador = await prisma.personas.create({
    data: {
      documento: '00000002',
      nombre: 'Carlos Subastador',
      estado: 'activo',
    },
  });
  await prisma.empleados.create({
    data: {
      identificador: personaSubastador.identificador,
      cargo: 'Subastador Principal',
      sector: sectorSubastadores.identificador,
    },
  });
  const subastador = await prisma.subastadores.create({
    data: {
      identificador: personaSubastador.identificador,
      matricula: 'MAT-001',
      region: 'CABA',
    },
  });

  // ─── 6. USUARIO DEMO ────────────────────────────────────────────────────
  // Credenciales: demo@hammer.com / Demo1234!  |  Categoría: Oro
  const hashDemo = await bcrypt.hash('Demo1234!', 10);

  // Usamos el primer país disponible (cargado con paises.sql)
  const primerPais = await prisma.paises.findFirst({ orderBy: { numero: 'asc' } });

  const personaDemo = await prisma.personas.create({
    data: {
      documento: '99999999',
      nombre: 'Usuario Demo',
      direccion: 'Av. Corrientes 1234, CABA',
      estado: 'activo',
    },
  });

  const clienteDemo = await prisma.clientes.create({
    data: {
      identificador: personaDemo.identificador,
      numeroPais: primerPais?.numero ?? null,
      admitido: 'si',
      categoria: 'oro',
      verificador: empleadoAdmin.identificador,
      extra_credencialesCliente: {
        create: {
          email: 'demo@hammer.com',
          passwordHash: hashDemo,
          debeCambiarClave: 'no',
          estadoCredencial: 'activo',
        },
      },
    },
  });

  // El usuario demo también actúa como dueño para poder asociarle productos
  const duenioDemo = await prisma.duenios.create({
    data: {
      identificador: personaDemo.identificador,
      numeroPais: primerPais?.numero ?? null,
      verificacionFinanciera: 'si',
      verificacionJudicial: 'si',
      calificacionRiesgo: 1,
      verificador: empleadoAdmin.identificador,
    },
  });

  console.log(`Usuario demo → demo@hammer.com | ID=${personaDemo.identificador}`);

  // ─── 7. PRODUCTOS ───────────────────────────────────────────────────────
  const placeholder = Buffer.from('PLACEHOLDER_IMG');

  const prod1 = await prisma.productos.create({
    data: {
      fecha: new Date('2025-01-15'),
      disponible: 'si',
      descripcionCatalogo: 'Reloj Omega Vintage 1965',
      descripcionCompleta: 'Reloj de bolsillo Omega en acero inoxidable, restaurado, funcionamiento perfecto.',
      revisor: empleadoAdmin.identificador,
      duenio: duenioDemo.identificador,
      seguro: 'POL-HAMMER-001',
    },
  });
  await prisma.fotos.create({ data: { producto: prod1.identificador, foto: placeholder } });

  const prod2 = await prisma.productos.create({
    data: {
      fecha: new Date('2025-01-15'),
      disponible: 'si',
      descripcionCatalogo: 'Cuadro al Óleo — Paisaje Patagónico',
      descripcionCompleta: 'Óleo sobre tela firmado, escuela regional patagónica, circa 1980. Marco original.',
      revisor: empleadoAdmin.identificador,
      duenio: duenioDemo.identificador,
      seguro: 'POL-HAMMER-001',
    },
  });
  await prisma.fotos.create({ data: { producto: prod2.identificador, foto: placeholder } });

  const prod3 = await prisma.productos.create({
    data: {
      fecha: new Date('2025-02-01'),
      disponible: 'si',
      descripcionCatalogo: 'Collar de Diamantes Art Déco',
      descripcionCompleta: 'Collar oro 18k con diamantes naturales, diseño Art Déco circa 1930. Certificado GIA.',
      revisor: empleadoAdmin.identificador,
      duenio: duenioDemo.identificador,
      seguro: 'POL-HAMMER-001',
    },
  });
  await prisma.fotos.create({ data: { producto: prod3.identificador, foto: placeholder } });

  const prod4 = await prisma.productos.create({
    data: {
      fecha: new Date('2024-11-01'),
      disponible: 'si',
      descripcionCatalogo: 'Jarrón Porcelana China Siglo XVIII',
      descripcionCompleta: 'Jarrón de porcelana azul y blanca, período Qing. Certificado de autenticidad incluido.',
      revisor: empleadoAdmin.identificador,
      duenio: duenioDemo.identificador,
      seguro: 'POL-HAMMER-001',
    },
  });
  await prisma.fotos.create({ data: { producto: prod4.identificador, foto: placeholder } });

  // ─── 8. SUBASTAS ────────────────────────────────────────────────────────
  const horaDefault = new Date('1970-01-01T19:00:00Z');
  const fechaProxSemana = new Date();
  fechaProxSemana.setDate(fechaProxSemana.getDate() + 7);
  const fechaProxQuincena = new Date();
  fechaProxQuincena.setDate(fechaProxQuincena.getDate() + 14);

  // Subasta 1 — Abierta, categoría común, semana próxima
  const subasta1 = await prisma.subastas.create({
    data: {
      fecha: fechaProxSemana,
      hora: horaDefault,
      estado: 'abierta',
      subastador: subastador.identificador,
      ubicacion: 'Salón Principal, Palermo, Buenos Aires',
      capacidadAsistentes: 200,
      tieneDeposito: 'si',
      seguridadPropia: 'si',
      categoria: 'comun',
      extra_subastas: {
        create: {
          titulo: 'Subasta de Arte Moderno',
          descripcion: 'Selección curada de pinturas y esculturas de artistas contemporáneos argentinos.',
        },
      },
    },
  });

  // Subasta 2 — Abierta, categoría oro, quincena próxima
  const subasta2 = await prisma.subastas.create({
    data: {
      fecha: fechaProxQuincena,
      hora: new Date('1970-01-01T20:00:00Z'),
      estado: 'abierta',
      subastador: subastador.identificador,
      ubicacion: 'Sala VIP, Puerto Madero, Buenos Aires',
      capacidadAsistentes: 50,
      tieneDeposito: 'si',
      seguridadPropia: 'si',
      categoria: 'oro',
      extra_subastas: {
        create: {
          titulo: 'Subasta Exclusiva de Joyas y Relojes',
          descripcion: 'Piezas únicas de alta joyería y relojería de lujo. Acceso exclusivo categoría Oro y Platino.',
        },
      },
    },
  });

  // Subasta 3 — Cerrada, historial
  const subasta3 = await prisma.subastas.create({
    data: {
      fecha: new Date('2025-12-01'),
      hora: new Date('1970-01-01T18:00:00Z'),
      estado: 'cerrada',
      subastador: subastador.identificador,
      ubicacion: 'Sala Histórica, San Telmo, Buenos Aires',
      capacidadAsistentes: 150,
      tieneDeposito: 'si',
      seguridadPropia: 'no',
      categoria: 'comun',
      extra_subastas: {
        create: {
          titulo: 'Subasta de Antigüedades del Río de la Plata',
          descripcion: 'Colección de antigüedades y objetos históricos del patrimonio rioplatense.',
        },
      },
    },
  });

  // ─── 9. CATÁLOGOS E ÍTEMS ───────────────────────────────────────────────
  // Subasta 1 → prod1 + prod2
  const cat1 = await prisma.catalogos.create({
    data: {
      descripcion: 'Catálogo — Subasta de Arte Moderno',
      subasta: subasta1.identificador,
      responsable: empleadoAdmin.identificador,
    },
  });
  await prisma.itemsCatalogo.createMany({
    data: [
      { catalogo: cat1.identificador, producto: prod1.identificador, precioBase: 8500.0,  comision: 12.0, subastado: 'no' },
      { catalogo: cat1.identificador, producto: prod2.identificador, precioBase: 4200.0,  comision: 12.0, subastado: 'no' },
    ],
  });

  // Subasta 2 → prod3
  const cat2 = await prisma.catalogos.create({
    data: {
      descripcion: 'Catálogo — Subasta Exclusiva de Joyas',
      subasta: subasta2.identificador,
      responsable: empleadoAdmin.identificador,
    },
  });
  await prisma.itemsCatalogo.create({
    data: { catalogo: cat2.identificador, producto: prod3.identificador, precioBase: 35000.0, comision: 15.0, subastado: 'no' },
  });

  // Subasta 3 → prod4 (cerrada, subastado = 'si')
  const cat3 = await prisma.catalogos.create({
    data: {
      descripcion: 'Catálogo — Subasta de Antigüedades',
      subasta: subasta3.identificador,
      responsable: empleadoAdmin.identificador,
    },
  });
  await prisma.itemsCatalogo.create({
    data: { catalogo: cat3.identificador, producto: prod4.identificador, precioBase: 12000.0, comision: 10.0, subastado: 'si' },
  });

  // ─── 10. NOTIFICACIONES PARA EL USUARIO DEMO ───────────────────────────
  await prisma.notificaciones.createMany({
    data: [
      {
        identificadorPersona: personaDemo.identificador,
        mensaje: 'Tu método de pago fue verificado exitosamente.',
        leido: false,
      },
      {
        identificadorPersona: personaDemo.identificador,
        mensaje: 'Una subasta de tu categoría (Oro) está por comenzar. ¡No te la pierdas!',
        leido: false,
      },
      {
        identificadorPersona: personaDemo.identificador,
        mensaje: 'Tu puja fue superada en el ítem Reloj Omega Vintage. ¡Pujá nuevamente para recuperar la delantera!',
        leido: false,
      },
    ],
  });

  console.log('');
  console.log('Seed completado con exito!');
  console.log('──────────────────────────────────────');
  console.log(`Empleado admin:   identificador=${personaAdmin.identificador} (debe ser 1)`);
  console.log('Usuario demo:     demo@hammer.com / Demo1234!');
  console.log('Categoria demo:   Oro');
  console.log(`Subastas:         IDs ${subasta1.identificador}, ${subasta2.identificador}, ${subasta3.identificador}`);
  console.log('Prerequisito:     paises.sql debe ejecutarse antes del seed');
  console.log('──────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
