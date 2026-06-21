import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkAndCloseAuctions = async () => {
  try {
    const now = new Date();

    // Buscar subastas abiertas cuya fechaFin ya pasó (requiere campo fechaFin en extra_subastas)
    const subastasAbiertas = await prisma.subastas.findMany({
      where: { estado: 'abierta' },
      include: {
        extra_subastas: true,
        catalogos: {
          include: {
            itemsCatalogo: {
              include: {
                productos: true,
                pujos: {
                  include: {
                    asistentes: {
                      include: {
                        clientes: { include: { personas: true } },
                      },
                    },
                  },
                  orderBy: { importe: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    for (const subasta of subastasAbiertas) {
      const extra = subasta.extra_subastas?.[0];
      // fechaFin requiere agregar la columna en SQL Server: ALTER TABLE extra_subastas ADD fechaFin DATETIME2 NULL
      const fechaFin = (extra as any)?.fechaFin as Date | null | undefined;
      if (!fechaFin || new Date(fechaFin) > now) continue;

      await prisma.subastas.update({
        where: { identificador: subasta.identificador },
        data: { estado: 'cerrada' },
      });

      const items = subasta.catalogos.flatMap((c) => c.itemsCatalogo);

      for (const item of items) {
        const pujaMasAlta = item.pujos[0]; // ya viene ordenada desc

        if (pujaMasAlta) {
          await prisma.$transaction([
            prisma.pujos.update({
              where: { identificador: pujaMasAlta.identificador },
              data: { ganador: 'si' },
            }),
            prisma.itemsCatalogo.update({
              where: { identificador: item.identificador },
              data: { subastado: 'si' },
            }),
          ]);

          const personaId = pujaMasAlta.asistentes?.clientes?.personas?.identificador;
          if (personaId) {
            await prisma.notificaciones.create({
              data: {
                identificadorPersona: personaId,
                mensaje: `¡Felicitaciones! Ganaste el artículo "${item.productos?.descripcionCatalogo ?? ''}" por $${pujaMasAlta.importe}.`,
              },
            });
          }
        } else {
          await prisma.itemsCatalogo.update({
            where: { identificador: item.identificador },
            data: { subastado: 'no' },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error en auction closer:', error);
  }
};
