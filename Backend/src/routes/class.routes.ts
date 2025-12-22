import { Router } from 'express';
import { protect } from '../middlewares/protect';
import {
  getClasses,
  addClass,
  deleteClass,
  changeClass,
  getClassById,
} from '../controllers/class.controller';

const router = Router();

router.use(protect);

router.get('/', getClasses);
router.get('/:id', getClassById);
router.post('/', addClass);
router.delete('/:id', deleteClass);
router.patch('/:id', changeClass);

export default router;
