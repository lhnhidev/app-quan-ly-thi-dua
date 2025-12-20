import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { index } from '../controllers/assignClasses.controller';

const router = Router();

router.patch('/', protect, index);

export default router;
