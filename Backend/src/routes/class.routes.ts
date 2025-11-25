import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { getClasses, addClass, deleteClass } from '../controllers/class.controller';

const router = Router();

router.use(protect);

router.get('/', getClasses);
router.post('/', addClass);
router.delete('/:classId', deleteClass);

export default router;
