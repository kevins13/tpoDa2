import { Router } from 'express';
import { requireAuth } from '../../middlewares/autenticacion';
import {
  createAuction,
  getAuctions,
  getAuctionById,
  registerForAuction
} from './subastas.controller';

const router = Router();

router.post('/', requireAuth, createAuction);
router.get('/', getAuctions);
router.get('/:id', getAuctionById);
router.post('/:id/registrar', requireAuth, registerForAuction);

export default router;
