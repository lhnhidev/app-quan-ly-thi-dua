import { Router } from 'express';
import { protect } from '../middlewares/protect';
import {
  getClasses,
  addClass,
  deleteClass,
  changeClass,
  getClassById,
  renderClassInRedFlag,
} from '../controllers/class.controller';

const router = Router();

router.use(protect);

router.get('/', getClasses);
router.get('/:id', getClassById);
router.get('/get/:id', renderClassInRedFlag);
router.post('/', addClass);
router.delete('/:id', deleteClass);
router.patch('/:id', changeClass);

export default router;
