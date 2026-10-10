import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rate-limit.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { uploadAvatar } from '../../middlewares/upload.middleware';
import {
  adminRegisterSchema,
  customerRegisterSchema,
  forgotPasswordSchema,
  loginSchema,
  providerRegisterSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  sendRegistrationOtpSchema,
  verifyRegistrationOtpSchema,
  resendRegistrationOtpSchema,
  changePasswordSchema,
  verifyResetOtpSchema,
  updateMyProfileSchema,
} from './auth.validation';
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  registerAdminController,
  registerCustomerController,
  registerProviderController,
  resetPassword,
  sendRegistrationOtpController,
  verifyRegistrationOtpController,
  resendRegistrationOtpController,
  changePasswordController,
  verifyResetOtpController,
  updateMyProfileController,
  uploadProfileImageController,
  quickAuthController,
} from './auth.controller';

const router = Router();

// Fast 1-Step Hunter Authentication (Email / Social / Guest Link)
router.post('/quick-auth', authRateLimiter, quickAuthController);

// Action-Oriented 4-Digit OTP Hunter Registration
router.post(
  '/send-registration-otp',
  authRateLimiter,
  validateRequest({ body: sendRegistrationOtpSchema }),
  sendRegistrationOtpController
);
router.post(
  '/verify-registration-otp-and-create-account',
  authRateLimiter,
  validateRequest({ body: verifyRegistrationOtpSchema }),
  verifyRegistrationOtpController
);
router.post(
  '/resend-registration-otp',
  authRateLimiter,
  validateRequest({ body: resendRegistrationOtpSchema }),
  resendRegistrationOtpController
);

router.post('/register/customer', authRateLimiter, validateRequest({ body: customerRegisterSchema }), registerCustomerController);
router.post('/register/provider', authRateLimiter, validateRequest({ body: providerRegisterSchema }), registerProviderController);
router.post('/register/admin', authenticate, authorizeAdmin, validateRequest({ body: adminRegisterSchema }), registerAdminController);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), login);
router.post('/forgot-password', authRateLimiter, validateRequest({ body: forgotPasswordSchema }), forgotPassword);
router.post('/request-password-reset-otp', authRateLimiter, validateRequest({ body: forgotPasswordSchema }), forgotPassword);
router.post('/verify-reset-otp', authRateLimiter, validateRequest({ body: verifyResetOtpSchema }), verifyResetOtpController);
router.post('/reset-password', authRateLimiter, validateRequest({ body: resetPasswordSchema }), resetPassword);
router.post('/reset-account-password', authRateLimiter, validateRequest({ body: resetPasswordSchema }), resetPassword);
router.post('/refresh', validateRequest({ body: refreshTokenSchema }), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post(
  '/change-password',
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  changePasswordController
);
router.post(
  '/upload-profile-image',
  authenticate,
  uploadAvatar.single('avatar'),
  uploadProfileImageController
);
router.patch(
  '/update-my-profile',
  authenticate,
  uploadAvatar.single('avatar'),
  validateRequest({ body: updateMyProfileSchema }),
  updateMyProfileController
);

export default router;

