import { Router } from 'express';
import { protect } from '../middlewares/protect';
import {
  approveOrganizationMember,
  createOrganization,
  deleteOrganization,
  getOrganizationInviteInfo,
  getPendingOrganizationMembers,
  getMyOrganizations,
  joinOrganizationByInviteCode,
  rejectOrganizationMember,
  updateOrganization,
} from '../controllers/organization.controller';

const router = Router();

router.use(protect);

router.get('/my', getMyOrganizations);
router.get('/invite/:inviteCode', getOrganizationInviteInfo);
router.post('/', createOrganization);
router.post('/join/:inviteCode', joinOrganizationByInviteCode);
router.get('/:orgId/pending-requests', getPendingOrganizationMembers);
router.patch('/:orgId/members/:memberUserId/approve', approveOrganizationMember);
router.patch('/:orgId/members/:memberUserId/reject', rejectOrganizationMember);
router.patch('/:orgId', updateOrganization);
router.delete('/:orgId', deleteOrganization);

export default router;
