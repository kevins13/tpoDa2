import { Request, Response } from 'express';
import { paymentsService } from './pagos.service';

export class PaymentsController {
  async addPaymentMethod(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const { cardNumber, expiry, cvc, tipo } = req.body;
      const result = await paymentsService.addPaymentMethod({
        userId: userId.toString(),
        cardNumber,
        expiry,
        cvc,
        tipo,
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async getMyPaymentMethods(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const result = await paymentsService.getMyPaymentMethods(userId.toString());
      res.json({ status: 'success', data: result });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async removePaymentMethod(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const result = await paymentsService.removePaymentMethod(id, userId.toString());
      res.json({ status: 'success', data: result });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
}

export const paymentsController = new PaymentsController();
