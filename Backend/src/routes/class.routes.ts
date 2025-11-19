import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { getClasses } from '../controllers/class.controller';

const router = Router();

router.use(protect);

router.get('/', getClasses);

export default router;
