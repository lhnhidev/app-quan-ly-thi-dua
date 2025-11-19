import { Router } from 'express';
import { getRules } from '../controllers/rule.controller';

const router = Router();

router.get('/', getRules);

export default router;
