import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { index } from '../controllers/checkToken.controller';

const router = Router();

router.get('/', protect, index);

export default router;
