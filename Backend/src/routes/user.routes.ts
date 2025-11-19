import { Router } from 'express';
import { getUsers, createUser, index, loginUser } from '../controllers/user.controller';
import { protect } from '../middlewares/protect';

const router = Router();

router.post('/login', loginUser);

router.use(protect);

router.get('/test', index);
router.get('/', getUsers);
router.post('/createNewUser', createUser);

export default router;
