import { prisma } from '../../configuracion/baseDatos';
import { io } from '../../index';

export const auctionEndTimes: Record<number, number> = {};
export const auctionTimers: Record<number, NodeJS.Timeout> = {};

export const closeAuction = async (subastaId: number) => {
  try {
    delete auctionEndTimes[subastaId];
    delete auctionTimers[subastaId];
    
    const subasta = await prisma.subastas.findUnique({ where: { identificador: subastaId } });
    if (!subasta || subasta.estado === 'cerrada') return;

    const catalogo = await prisma.catalogos.findFirst({ where: { subasta: subastaId } });
    const itemCat = await prisma.itemsCatalogo.findFirst({
      where: { catalogo: catalogo?.identificador },
      include: { pujos: true, productos: true }
    });

    if (itemCat && itemCat.pujos.length > 0) {
      console.log(`Cerrando subasta ${subastaId} (hay pujas)...`);
      await prisma.subastas.update({
        where: { identificador: subastaId },
        data: { estado: 'cerrada' }
      });

      const winningBid = itemCat.pujos.reduce((prev, current) => 
        (Number(prev.importe) > Number(current.importe)) ? prev : current
      );

      await prisma.pujos.update({
        where: { identificador: winningBid.identificador },
        data: { ganador: 'si' }
      });

      await prisma.itemsCatalogo.update({
        where: { identificador: itemCat.identificador },
        data: { subastado: 'si' }
      });

      const asistente = await prisma.asistentes.findUnique({
        where: { identificador: winningBid.asistente }
      });

      if (asistente) {
        if (itemCat.productos) {
           await prisma.registroDeSubasta.create({
             data: {
               subasta: subastaId,
               duenio: itemCat.productos.duenio,
               producto: itemCat.productos.identificador,
               cliente: asistente.cliente,
               importe: winningBid.importe,
               comision: itemCat.comision
             }
           });
           
           await prisma.notificaciones.create({
             data: { identificadorPersona: asistente.cliente, mensaje: `¡Felicidades! Has ganado la subasta de "${itemCat.productos.descripcionCatalogo}". Ve a Mis Compras para proceder al pago.` }
           });

           await prisma.notificaciones.create({
             data: { identificadorPersona: itemCat.productos.duenio, mensaje: `¡Tu artículo "${itemCat.productos.descripcionCatalogo}" ha sido vendido por $${winningBid.importe}!` }
           });
        }
      }
      io.to(`item_${itemCat.identificador}`).emit('auction_ended', { winnerId: asistente?.cliente, amount: winningBid.importe });
    }
  } catch (e) {
    console.error("Error cerrando subasta automáticamente:", e);
  }
};


export class ArticlesService {
  async submitArticle(data: { userId: number, descripcionCatalogo: string, descripcionCompleta: string, fotosBase64?: string[] }) {
    // Verificamos si el usuario es dueño
    let duenio = await prisma.duenios.findUnique({
      where: { identificador: data.userId }
    });

    if (!duenio) {
      // Si no es dueño, lo creamos asignándole un revisor por defecto
      const empleado = await prisma.empleados.findFirst();

      if (!empleado) throw new Error('No hay revisores disponibles en el sistema');

      duenio = await prisma.duenios.create({
        data: {
          identificador: data.userId,
          verificacionFinanciera: 'no',
          verificacionJudicial: 'no',
          calificacionRiesgo: 3,
          verificador: empleado.identificador
        }
      });
    }

    const revisor = await prisma.empleados.findFirst();

    if (!revisor) throw new Error('No hay revisores disponibles en el sistema');

    const seguro = await prisma.seguros.findFirst();

    // Creamos el producto pendiente de aprobación (disponible: 'no')
    const producto = await prisma.productos.create({
      data: {
        fecha: new Date(),
        disponible: 'no',
        descripcionCatalogo: data.descripcionCatalogo,
        descripcionCompleta: data.descripcionCompleta,
        revisor: revisor.identificador,
        duenio: duenio.identificador,
        seguro: seguro ? seguro.nroPoliza : undefined
      }
    });

    // Guardar fotos
    if (data.fotosBase64 && data.fotosBase64.length > 0) {
      for (const f of data.fotosBase64) {
        await prisma.fotos.create({
          data: {
            producto: producto.identificador,
            foto: Buffer.from(f, 'base64')
          }
        });
      }
    }

    await prisma.notificaciones.create({
      data: {
        identificadorPersona: data.userId,
        mensaje: `Has enviado el artículo "${data.descripcionCatalogo}" para su validación.`
      }
    });

    return producto;
  }

  async getMyArticles(userId: number) {
    const productos = await prisma.productos.findMany({
      where: { duenio: userId },
      include: {
        itemsCatalogo: {
          include: {
            catalogos: {
              include: { subastas: true }
            }
          }
        }
      }
    });
    return productos;
  }
}

export const articlesService = new ArticlesService();
