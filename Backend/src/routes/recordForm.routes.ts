import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { getRecordForms } from '../controllers/recordForm.controller';

const router = Router();

router.use(protect);

router.get('/', getRecordForms);

export default router;
