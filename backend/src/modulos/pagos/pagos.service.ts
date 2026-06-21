import { prisma } from '../../configuracion/baseDatos';

export class PaymentsService {
  async addPaymentMethod(data: { userId: string; cardNumber: string; expiry: string; cvc: string; tipo?: string }) {
    if (data.cardNumber.length < 13) {
      throw new Error('Número de tarjeta inválido');
    }

    const method = await prisma.extra_metodosPago.create({
      data: {
        cliente: parseInt(data.userId),
        tipo: data.tipo || 'tarjeta',
        numero: data.cardNumber,
        vencimiento: data.expiry,
        cvv: data.cvc,
      },
    });

    return method;
  }

  async getMyPaymentMethods(userId: string) {
    return prisma.extra_metodosPago.findMany({
      where: { cliente: parseInt(userId) },
    });
  }

  async removePaymentMethod(paymentId: string, userId: string) {
    const payment = await prisma.extra_metodosPago.findUnique({
      where: { identificador: parseInt(paymentId) },
    });

    if (!payment) throw new Error('Método de pago no encontrado');
    if (payment.cliente !== parseInt(userId)) throw new Error('No autorizado');

    await prisma.extra_metodosPago.delete({
      where: { identificador: parseInt(paymentId) },
    });

    return { message: 'Eliminado correctamente' };
  }
}

export const paymentsService = new PaymentsService();
