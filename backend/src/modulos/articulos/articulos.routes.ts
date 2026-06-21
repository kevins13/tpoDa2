import { Router } from 'express';
import { articlesController } from './articulos.controller';
import { requireAuth } from '../../middlewares/autenticacion';

const router = Router();

router.post('/enviar', requireAuth, articlesController.submitArticle.bind(articlesController));
router.get('/mis-articulos', requireAuth, articlesController.getMyArticles.bind(articlesController));

export const articulosRoutes = router;
