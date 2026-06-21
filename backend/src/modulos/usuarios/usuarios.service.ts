import { prisma } from '../../configuracion/baseDatos';

export class UsersService {
  async getUserProfile(userId: string) {
    const id = parseInt(userId, 10);
    const persona = await prisma.personas.findUnique({
      where: { identificador: id },
      include: {
        clientes: {
          include: {
            extra_credencialesCliente: { take: 1 },
            paises: true,
          },
        },
      },
    });

    if (!persona) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: persona.identificador.toString(),
      firstName: persona.nombre.split(' ')[0] || '',
      lastName: persona.nombre.split(' ').slice(1).join(' ') || '',
      email: persona.clientes?.extra_credencialesCliente?.[0]?.email ?? '',
      country: persona.clientes?.paises?.nombre || '',
      address: persona.direccion || '',
      category: persona.clientes?.categoria || 'comun',
      isApproved: persona.clientes?.admitido === 'si',
      documentFront: persona.foto ? 'base64-image' : null,
      documentBack: null,
      createdAt: persona.clientes?.extra_credencialesCliente?.[0]?.fechaRegistro?.toISOString().split('T')[0] ?? null,
    };
  }

  async updateProfile(userId: string, data: any) {
    const id = parseInt(userId, 10);
    const persona = await prisma.personas.update({
      where: { identificador: id },
      data: {
        nombre: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        direccion: `${data.address || ''}, ${data.country || ''}`.trim(),
      },
      include: {
        clientes: {
          include: { extra_credencialesCliente: true },
        },
      },
    });

    return {
      id: persona.identificador.toString(),
      firstName: persona.nombre.split(' ')[0] || '',
      lastName: persona.nombre.split(' ').slice(1).join(' ') || '',
      email: persona.clientes?.extra_credencialesCliente?.[0]?.email ?? '',
      country: data.country || '',
      address: data.address || '',
      category: persona.clientes?.categoria || 'comun',
    };
  }

  async uploadDocuments(userId: string, frontUrl: string, backUrl: string) {
    return { message: "Simulación de subida de documento completa." };
  }

  async getUserStats(userId: string) {
    const id = parseInt(userId, 10);
    
    // Contar subastas donde este usuario participó (bids / pujos)
    const pujos = await prisma.pujos.count({
      where: { asistentes: { cliente: id } }
    });

    const ganadas = await prisma.pujos.count({
      where: { asistentes: { cliente: id }, ganador: 'si' }
    });

    const itemsVendidos = await prisma.productos.count({
      where: { duenio: id, itemsCatalogo: { some: { subastado: 'si' } } }
    });

    const compras = await prisma.registroDeSubasta.aggregate({
      where: { cliente: id },
      _sum: { importe: true }
    });

    const ventas = await prisma.registroDeSubasta.aggregate({
      where: { duenio: id },
      _sum: { importe: true }
    });

    return {
      totalBids: pujos,
      auctionsWon: ganadas,
      itemsSold: itemsVendidos,
      totalSpent: compras._sum.importe || 0,
      totalEarned: ventas._sum.importe || 0
    };
  }

  async getMyPurchases(userId: string) {
    const id = parseInt(userId, 10);
    return prisma.registroDeSubasta.findMany({
      where: { cliente: id },
      include: {
        productos: true,
        subastas: {
          include: { extra_subastas: true }
        }
      }
    });
  }

  async getUserById(id: string) {
    return prisma.personas.findUnique({ where: { identificador: parseInt(id, 10) } });
  }

  async getUserCategory(id: string): Promise<string> {
    const cliente = await prisma.clientes.findUnique({ where: { identificador: parseInt(id, 10) }, select: { categoria: true } });
    if (!cliente) return 'comun';
    return cliente.categoria || 'comun';
  }
}

export const usersService = new UsersService();
