import { Router } from 'express';
import {
  getUsers,
  createUser,
  index,
  loginUser,
  deleteUser,
  modifyUser,
  getCoDo,
  getTrackingReport,
} from '../controllers/user.controller';
import { protect } from '../middlewares/protect';

const router = Router();

router.post('/login', loginUser);

router.use(protect);

router.get('/', getUsers);
router.post('/getTrackingReport', getTrackingReport);
router.get('/test', index);
router.get('/co-do', getCoDo);
router.post('/createNewUser', createUser);
router.delete('/deleteUser/:id', deleteUser);
router.patch('/modifyUser/:id', modifyUser);

export default router;
