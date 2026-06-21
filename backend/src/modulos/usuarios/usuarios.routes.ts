import { Router } from 'express';
import { usersController } from './usuarios.controller';
import { requireAuth } from '../../middlewares/autenticacion';
import { validateRequest } from '../../middlewares/validarSolicitud';
import { updateProfileSchema } from './usuarios.schema';

const router = Router();

// Todas las rutas de usuario requieren autenticación
router.use(requireAuth as any);

router.get('/yo', usersController.getProfile as any);
router.put('/yo', validateRequest(updateProfileSchema), usersController.updateProfile as any);

router.post('/yo/documentos', usersController.uploadDocuments as any);
router.get('/yo/documentos', usersController.getDocumentStatus as any);

router.get('/yo/estadisticas', usersController.getStats as any);
router.get('/yo/compras', usersController.getPurchases as any);
router.get('/yo/categoria', usersController.getCategory as any);

export default router;
