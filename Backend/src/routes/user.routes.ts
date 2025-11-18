import { Router } from 'express';
import { getUsers, createUser, index, loginUser } from '../controllers/user.controller';

const router = Router();

router.get('/test', index);
router.get('/', getUsers);
router.post('/createNewUser', createUser);
router.post('/login', loginUser);

export default router;
