import { Router } from 'express';
import multer from 'multer';
import { authController } from './autenticacion.controller';
import { validateRequest } from '../../middlewares/validarSolicitud';
import { registerSchema, loginSchema, completeRegistrationSchema, forgotPasswordSchema } from './autenticacion.schema';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/registrar', upload.fields([{ name: 'fotoFrente', maxCount: 1 }, { name: 'fotoDorso', maxCount: 1 }]), validateRequest(registerSchema), authController.register);
router.post('/completar-registro', validateRequest(completeRegistrationSchema), authController.completeRegistration);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/olvide-contrasena', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/admin/validar-cliente/:id', authController.validarCliente);
router.post('/admin/rechazar-cliente/:id', authController.rechazarCliente);

export default router;
