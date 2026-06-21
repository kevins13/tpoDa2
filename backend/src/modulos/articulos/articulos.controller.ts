import { Request, Response } from 'express';
import { articlesService } from './articulos.service';

export class ArticlesController {
  async submitArticle(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const { descripcionCatalogo, descripcionCompleta, fotosBase64 } = req.body;
      const result = await articlesService.submitArticle({
        userId: parseInt(userId, 10),
        descripcionCatalogo,
        descripcionCompleta,
        fotosBase64
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async getMyArticles(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const result = await articlesService.getMyArticles(parseInt(userId, 10));
      res.json({ status: 'success', data: result });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
}

export const articlesController = new ArticlesController();
