import { Router } from 'express';
import { placeBid, getBidsByItem, getMyBids } from './pujos.controller';
import { requireAuth } from '../../middlewares/autenticacion';

const router = Router();

router.get('/mis-pujos', requireAuth, getMyBids);
router.get('/item/:catalogItemId', getBidsByItem);
router.post('/item/:catalogItemId', requireAuth, placeBid);

export default router;
