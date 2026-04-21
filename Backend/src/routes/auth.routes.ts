import { Router } from 'express';
import {
  requestRegisterOtp,
  resendRegisterOtp,
  verifyRegisterOtp,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register/request-otp', requestRegisterOtp);
router.post('/register/verify-otp', verifyRegisterOtp);
router.post('/register/resend-otp', resendRegisterOtp);

export default router;
