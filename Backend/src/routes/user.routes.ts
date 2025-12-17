import { Router } from 'express';
import {
  getUsers,
  createUser,
  index,
  loginUser,
  deleteUser,
  modifyUser,
} from '../controllers/user.controller';
import { protect } from '../middlewares/protect';

const router = Router();

router.post('/login', loginUser);

router.use(protect);

router.get('/', getUsers);
router.get('/test', index);
router.post('/createNewUser', createUser);
router.delete('/deleteUser/:id', deleteUser);
router.patch('/modifyUser/:id', modifyUser);

export default router;
