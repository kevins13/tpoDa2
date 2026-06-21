import { Router } from 'express';
import { requireAuth } from '../../middlewares/autenticacion';
import { getMyNotifications, markAsRead } from './notificaciones.controller';

const router = Router();

router.get('/', requireAuth, getMyNotifications);
router.put('/:id/leida', requireAuth, markAsRead);

export const notificacionesRoutes = router;
