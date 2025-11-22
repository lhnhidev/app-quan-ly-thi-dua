import { Router } from 'express';
import { protect } from '../middlewares/protect';
import {
  getRecordForms,
  addRecordForm,
  deleteRecordForm,
  modifyRecordForm,
} from '../controllers/recordForm.controller';

const router = Router();

router.use(protect);

router.get('/', getRecordForms);
router.post('/', addRecordForm);
router.delete('/:id', deleteRecordForm);
router.patch('/:id', modifyRecordForm);

export default router;
