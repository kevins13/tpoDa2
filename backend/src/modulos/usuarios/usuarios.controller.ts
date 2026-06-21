import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/autenticacion';
import { usersService } from './usuarios.service';

export class UsersController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('No autenticado');
      const profile = await usersService.getUserProfile(req.user.id);
      res.json({ user: profile });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('No autenticado');
      const updatedUser = await usersService.updateProfile(req.user.id, req.body);
      res.json({ user: updatedUser });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async uploadDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('No autenticado');
      const { frontUrl, backUrl } = req.body; // Mock: se envian las URLs
      await usersService.uploadDocuments(req.user.id, frontUrl, backUrl);
      res.json({ message: 'Documentos subidos con éxito' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async getDocumentStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('No autenticado');
      const profile = await usersService.getUserProfile(req.user.id);
      res.json({
        isApproved: profile.isApproved,
        hasDocuments: !!(profile.documentFront && profile.documentBack),
      });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('No autenticado');
      const stats = await usersService.getUserStats(req.user.id);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async getPurchases(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('No autenticado');
      const purchases = await usersService.getMyPurchases(req.user.id);
      res.json(purchases);
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async getCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('No autenticado');
      const category = await usersService.getUserCategory(req.user.id);
      res.json({ category });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  }
}

export const usersController = new UsersController();
