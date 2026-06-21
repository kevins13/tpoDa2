import { Router } from 'express';
import { paymentsController } from './pagos.controller';
import { requireAuth } from '../../middlewares/autenticacion';

const router = Router();

router.post('/', requireAuth, paymentsController.addPaymentMethod.bind(paymentsController));
router.get('/', requireAuth, paymentsController.getMyPaymentMethods.bind(paymentsController));
router.delete('/:id', requireAuth, paymentsController.removePaymentMethod.bind(paymentsController));

export const pagosRoutes = router;
