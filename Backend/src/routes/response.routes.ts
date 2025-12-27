import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { addResponse, changeResponse, getResponseList } from '../controllers/response.controller';

const router = Router();

router.use(protect);

router.get('/', getResponseList);
router.post('/', addResponse);
router.patch('/:id', changeResponse);

export default router;
