import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middlewares/autenticacion';
import { io } from '../../index';
import { closeAuction, auctionTimers, auctionEndTimes } from '../articulos/articulos.service';

const prisma = new PrismaClient();

function getCurrentPrice(pujos: any[], precioBase: any): number {
  if (!pujos || pujos.length === 0) return Number(precioBase);
  return Math.max(...pujos.map((p: any) => Number(p.importe)));
}

export const placeBid = async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.catalogItemId);
    const amount = parseFloat(req.body.amount);
    const clienteId = parseInt(req.user?.id?.toString() ?? '0');

    if (isNaN(itemId) || isNaN(amount) || !clienteId) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const item = await prisma.itemsCatalogo.findUnique({
      where: { identificador: itemId },
      include: {
        pujos: true,
        catalogos: {
          include: {
            subastas: {
              include: { extra_subastas: true },
            },
          },
        },
      },
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });

    const subasta = item.catalogos?.subastas;
    if (!subasta || subasta.estado === 'cerrada') {
       return res.status(403).json({ error: 'La subasta ya está cerrada.' });
    }

    const subastaId = subasta.identificador;

    const attendee = await prisma.asistentes.findFirst({
      where: { cliente: clienteId, subasta: subastaId },
    });
    if (!attendee) {
      return res.status(403).json({ error: 'Must be registered to bid' });
    }

    const currentPrice = getCurrentPrice(item.pujos, item.precioBase);
    if (amount <= currentPrice) {
      return res.status(400).json({ error: 'Bid amount must be greater than current price' });
    }

    const puja = await prisma.pujos.create({
      data: {
        asistente: attendee.identificador,
        item: itemId,
        importe: amount,
        ganador: 'no',
      },
      include: {
        asistentes: {
          include: { clientes: { include: { personas: true } } },
        },
      },
    });

    const nombre = puja.asistentes?.clientes?.personas?.nombre ?? '';
    const bidResponse = {
      id: puja.identificador.toString(),
      amount: Number(puja.importe),
      catalogItemId: itemId.toString(),
      user: {
        id: clienteId.toString(),
        firstName: nombre.split(' ')[0] ?? '',
        lastName: nombre.split(' ').slice(1).join(' ') ?? '',
      },
    };

    await prisma.notificaciones.create({
      data: {
        identificadorPersona: clienteId,
        mensaje: `Pujaste exitosamente $${amount} por el artículo "${item.productos?.descripcionCatalogo}".`
      }
    });

    io.to(`item_${itemId}`).emit('new_bid', bidResponse);

    // Resetear el timer de 60 segundos
    if (auctionTimers[subastaId]) {
      clearTimeout(auctionTimers[subastaId]);
    }
    auctionEndTimes[subastaId] = Date.now() + 60000;
    auctionTimers[subastaId] = setTimeout(() => {
      closeAuction(subastaId);
    }, 60000);

    // Notificar al cliente sobre el nuevo tiempo de fin para sincronizar
    io.to(`item_${itemId}`).emit('timer_update', { endTime: auctionEndTimes[subastaId] });

    res.status(201).json(bidResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error placing bid' });
  }
};

export const getBidsByItem = async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.catalogItemId);
    if (isNaN(itemId)) return res.status(400).json({ error: 'Invalid id' });

    const pujos = await prisma.pujos.findMany({
      where: { item: itemId },
      orderBy: { identificador: 'desc' },
      include: {
        asistentes: {
          include: {
            clientes: {
              include: { personas: true },
            },
          },
        },
      },
    });

    const bids = pujos.map((p) => {
      const nombre = p.asistentes?.clientes?.personas?.nombre ?? '';
      return {
        id: p.identificador.toString(),
        amount: Number(p.importe),
        catalogItemId: itemId.toString(),
        user: {
          id: p.asistentes?.clientes?.identificador?.toString() ?? '',
          firstName: nombre.split(' ')[0] ?? '',
          lastName: nombre.split(' ').slice(1).join(' ') ?? '',
        },
      };
    });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bids' });
  }
};

export const getMyBids = async (req: AuthRequest, res: Response) => {
  try {
    const clienteId = parseInt(req.user?.id?.toString() ?? '0');
    if (!clienteId) return res.status(401).json({ error: 'Unauthorized' });

    const pujos = await prisma.pujos.findMany({
      where: {
        asistentes: { cliente: clienteId },
      },
      orderBy: { identificador: 'desc' },
      include: {
        itemsCatalogo: {
          include: {
            productos: {
              include: {
                fotos: true,
              },
            },
            pujos: true,
            catalogos: {
              include: {
                subastas: {
                  include: { extra_subastas: true },
                },
              },
            },
          },
        },
      },
    });

    const result = pujos.map((p) => {
      const item = p.itemsCatalogo;
      const subasta = item?.catalogos?.subastas;
      const extra = subasta?.extra_subastas?.[0];
      const currentPrice = getCurrentPrice(item?.pujos ?? [], item?.precioBase ?? 0);
      const firstFoto = item?.productos?.fotos?.[0]?.foto;
      const image = firstFoto ? `data:image/jpeg;base64,${firstFoto.toString('base64')}` : null;
      return {
        id: p.identificador.toString(),
        amount: Number(p.importe),
        catalogItem: {
          id: item?.identificador?.toString() ?? '',
          title: item?.productos?.descripcionCatalogo ?? '',
          currentPrice,
          auctionId: subasta?.identificador?.toString() ?? '',
          auctionTitle: extra?.titulo ?? 'Sin título',
          image,
        },
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user bids' });
  }
};
