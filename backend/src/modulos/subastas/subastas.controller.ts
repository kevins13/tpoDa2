import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middlewares/autenticacion';

const prisma = new PrismaClient();

const EMPLEADO_DEFAULT = 1; // empleado verificador por defecto para catálogos

function mergeDateTime(fecha: Date | null, hora: Date): Date {
  if (!fecha) return hora;
  const d = new Date(fecha);
  d.setHours(hora.getHours(), hora.getMinutes(), hora.getSeconds(), hora.getMilliseconds());
  return d;
}

function deriveStatus(subasta: any): string {
  if (!subasta.estado) return 'pendiente';
  const extra = subasta.extra_subastas?.[0];
  const now = new Date();
  if (extra?.fechaFin && new Date(extra.fechaFin) < now) return 'cerrada';
  const startDate = mergeDateTime(subasta.fecha, subasta.hora);
  if (startDate > now) return 'pendiente';
  return subasta.estado;
}

function mapItem(item: any, subastaId: string) {
  const importes = item.pujos?.map((p: any) => Number(p.importe)) ?? [];
  const currentPrice = importes.length > 0 ? Math.max(...importes) : Number(item.precioBase);
  const winnerPuja = item.pujos?.find((p: any) => p.ganador === 'si');
  const firstFoto = item.productos?.fotos?.[0]?.foto;
  const image = firstFoto ? `data:image/jpeg;base64,${firstFoto.toString('base64')}` : null;
  return {
    id: item.identificador.toString(),
    auctionId: subastaId,
    title: item.productos?.descripcionCatalogo ?? '',
    description: item.productos?.descripcionCompleta ?? '',
    startingPrice: Number(item.precioBase),
    currentPrice,
    winnerId: winnerPuja ? item.pujos?.find((p: any) => p.ganador === 'si')?.asistente?.toString() ?? null : null,
    status: item.subastado === 'si' ? 'vendido' : 'pendiente',
    image,
  };
}

function mapSubasta(s: any) {
  const extra = s.extra_subastas?.[0];
  const items = (s.catalogos ?? []).flatMap((c: any) =>
    (c.itemsCatalogo ?? []).map((item: any) => mapItem(item, s.identificador.toString()))
  );
  return {
    id: s.identificador.toString(),
    title: extra?.titulo ?? 'Sin título',
    description: extra?.descripcion ?? null,
    startDate: mergeDateTime(s.fecha, s.hora),
    endDate: extra?.fechaFin ?? null,
    category: s.categoria ?? null,
    currency: 'pesos',
    status: deriveStatus(s),
    catalogItems: items,
    image: items?.[0]?.image ?? null,
  };
}

const includeSubasta = {
  extra_subastas: true,
  catalogos: {
    include: {
      itemsCatalogo: {
        include: {
          productos: {
            include: {
              fotos: true,
            },
          },
          pujos: true,
        },
      },
    },
  },
} as const;

export const getAuctions = async (req: Request, res: Response) => {
  try {
    const subastas = await prisma.subastas.findMany({
      include: includeSubasta,
      orderBy: { identificador: 'desc' },
    });
    res.json(subastas.map(mapSubasta));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching auctions' });
  }
};

export const getAuctionById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const subasta = await prisma.subastas.findUnique({
      where: { identificador: id },
      include: includeSubasta,
    });
    if (!subasta) return res.status(404).json({ error: 'Auction not found' });
    res.json(mapSubasta(subasta));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching auction' });
  }
};

export const createAuction = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, startDate, endDate, category } = req.body;

    const subasta = await prisma.subastas.create({
      data: {
        fecha: startDate ? new Date(startDate) : new Date(),
        hora: startDate ? new Date(startDate) : new Date(),
        estado: 'abierta',
        categoria: category ?? null,
        extra_subastas: {
          create: {
            titulo: title,
            descripcion: description ?? null,
          },
        },
        catalogos: {
          create: {
            descripcion: title,
            responsable: EMPLEADO_DEFAULT,
          },
        },
      },
      include: includeSubasta,
    });

    res.status(201).json(mapSubasta(subasta));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating auction' });
  }
};

export const registerForAuction = async (req: AuthRequest, res: Response) => {
  try {
    const subastaId = parseInt(req.params.id);
    const clienteId = parseInt(req.user?.id?.toString() ?? '0');
    if (isNaN(subastaId) || !clienteId) return res.status(400).json({ error: 'Invalid data' });

    const subasta = await prisma.subastas.findUnique({ where: { identificador: subastaId } });
    if (!subasta) return res.status(404).json({ error: 'Auction not found' });

    const existing = await prisma.asistentes.findFirst({
      where: { cliente: clienteId, subasta: subastaId },
    });
    if (existing) {
      return res.json({ success: true, bidderNum: existing.numeroPostor });
    }

    const count = await prisma.asistentes.count({ where: { subasta: subastaId } });
    const attendee = await prisma.asistentes.create({
      data: { cliente: clienteId, subasta: subastaId, numeroPostor: count + 1 },
    });

    await prisma.notificaciones.create({
      data: {
        identificadorPersona: clienteId,
        mensaje: `Te has registrado exitosamente para participar en la subasta #${subastaId}. ¡Ya puedes pujar!`
      }
    });

    res.json({ success: true, bidderNum: attendee.numeroPostor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error registering for auction' });
  }
};
