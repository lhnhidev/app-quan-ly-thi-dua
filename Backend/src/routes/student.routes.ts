import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { getStudents } from '../controllers/student.controller';

const router = Router();

router.use(protect);

router.get('/', getStudents);

export default router;
