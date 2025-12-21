import { Router } from 'express';
import { protect } from '../middlewares/protect';
import {
  getStudents,
  addStudents,
  modifyStudent,
  deleteStudent,
  getStudentsWithDetails,
} from '../controllers/student.controller';

const router = Router();

router.use(protect);

router.get('/', getStudents);
router.get('/desc', getStudentsWithDetails);
router.post('/', addStudents);
router.patch('/:id', modifyStudent);
router.delete('/:id', deleteStudent);

export default router;
