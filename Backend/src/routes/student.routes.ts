import { Router } from 'express';
import { protect } from '../middlewares/protect';
import {
  getStudents,
  addStudents,
  modifyStudent,
  deleteStudent,
  getStudentsWithDetails,
  getStudentByIdClass,
} from '../controllers/student.controller';

const router = Router();

router.use(protect);

router.get('/', getStudents);
router.get('/desc', getStudentsWithDetails);
router.get('/:id', getStudentByIdClass);
router.post('/', addStudents);
router.patch('/:id', modifyStudent);
router.delete('/:id', deleteStudent);

export default router;
