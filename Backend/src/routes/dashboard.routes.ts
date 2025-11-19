import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { getDashboardData } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', protect, getDashboardData);

export default router;
