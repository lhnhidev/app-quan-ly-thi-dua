import { Router } from 'express';
import { protect } from '../middlewares/protect';
import {
  getMessagesByPeer,
  getSocialUsers,
  recallMessage,
  sendMessage,
  undoRecallMessage,
} from '../controllers/social.controller';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
});

router.use(protect);

router.get('/users', getSocialUsers);
router.get('/messages/:peerId', getMessagesByPeer);
router.post('/messages', upload.array('attachments', 5), sendMessage);
router.patch('/messages/:messageId/recall', recallMessage);
router.patch('/messages/:messageId/undo-recall', undoRecallMessage);

export default router;
