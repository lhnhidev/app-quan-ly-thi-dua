import { Router } from 'express';
import { protect } from '../middlewares/protect';
import { getMyNotifications, markNotificationsRead } from '../controllers/notification.controller';

const router = Router();

router.use(protect);

router.get('/my', getMyNotifications);
router.patch('/mark-read', markNotificationsRead);

export default router;
