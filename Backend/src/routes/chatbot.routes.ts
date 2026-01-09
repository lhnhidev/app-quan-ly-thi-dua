import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { index } from '../controllers/chatbot.controller';

const router = Router();

router.post('/', protect, index);

export default router;
