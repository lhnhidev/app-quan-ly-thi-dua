import { Router } from 'express';
import { getUsers, createUser, index } from '../controllers/user.controller';

const router = Router();

router.get('/test', index);
router.get('/', getUsers);
router.post('/', createUser);

export default router;
