import { Router } from 'express';
import { protect } from '../middlewares/protect';
import {
  approveOrganizationMember,
  createOrganization,
  getMyOrganizations,
  joinOrganizationByInviteCode,
} from '../controllers/organization.controller';

const router = Router();

router.use(protect);

router.get('/my', getMyOrganizations);
router.post('/', createOrganization);
router.post('/join/:inviteCode', joinOrganizationByInviteCode);
router.patch('/:orgId/members/:memberUserId/approve', approveOrganizationMember);

export default router;
