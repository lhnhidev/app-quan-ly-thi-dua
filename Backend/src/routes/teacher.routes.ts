import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { getTeachers, addTeacher, deleteTeacher } from '../controllers/teacher.controller';

const router = Router();

router.use(protect);

router.get('/', getTeachers);
router.post('/', addTeacher);
router.delete('/:id', deleteTeacher);

export default router;
