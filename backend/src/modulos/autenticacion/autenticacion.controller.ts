import { Request, Response, NextFunction } from 'express';
import { authService } from './autenticacion.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const fotoFrente = files?.['fotoFrente']?.[0]?.buffer;
      const fotoDorso = files?.['fotoDorso']?.[0]?.buffer;
      const result = await authService.register(req.body, { fotoFrente, fotoDorso });
      res.status(201).json(result);
    } catch (error: any) {
      console.error("[REGISTRO ERROR]:", error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ status: 'error', message: error.message });
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (error: any) {
      console.error("[FORGOT PASSWORD ERROR]:", error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async completeRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.completeRegistration(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async validarCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const clienteId = parseInt(req.params.id, 10);
      const result = await authService.validarCliente(clienteId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async rechazarCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const clienteId = parseInt(req.params.id, 10);
      const result = await authService.rechazarCliente(clienteId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
}

export const authController = new AuthController();
