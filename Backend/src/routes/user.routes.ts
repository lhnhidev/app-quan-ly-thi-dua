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
  trackingRedFlag,
  getUserById,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getMyActivities,
} from '../controllers/user.controller';
import { protect } from '../middlewares/protect';

const router = Router();

router.post('/login', loginUser);

router.use(protect);

router.get('/', getUsers);
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.patch('/me/password', changeMyPassword);
router.get('/me/activities', getMyActivities);
router.post('/getTrackingReport', getTrackingReport);
router.post('/trackingRedFlag', trackingRedFlag);
router.get('/test', index);
router.get('/co-do', getCoDo);
router.get('/:id', getUserById);
router.post('/createNewUser', createUser);
router.delete('/deleteUser/:id', deleteUser);
router.patch('/modifyUser/:id', modifyUser);

export default router;
