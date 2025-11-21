import { Router } from 'express';
import { getRoles, addRole, deleteRole, updateRole } from '../controllers/role.controller';
import { protect } from '../middlewares/protect';

const router = Router();

router.use(protect);

router.get('/', getRoles);
router.post('/', addRole);
router.delete('/:id', deleteRole);
router.patch('/:id', updateRole);

export default router;
