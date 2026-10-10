import { Router } from 'express';
import adminRoutes from '../modules/admin/admin.routes';
import authRoutes from '../modules/auth/auth.route';
import availabilityRoutes from '../modules/availability/availability.routes';
import bookingRoutes from '../modules/booking/booking.routes';
import categoryRoutes from '../modules/category/category.routes';
import customerRoutes from '../modules/customer/customer.routes';
import navigationRoutes from '../modules/navigation/navigation.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import portfolioRoutes from '../modules/portfolio/portfolio.routes';
import providerRoutes from '../modules/provider/provider.routes';
import reportRoutes from '../modules/report/report.routes';
import requestRoutes from '../modules/request/request.routes';
import reviewRoutes from '../modules/review/review.routes';
import serviceRoutes from '../modules/service/service.routes';
import subscriptionRoutes from '../modules/subscription/subscription.routes';
import supportRoutes from '../modules/support/support.routes';

import huntRoutes from '../modules/hunt/hunt.routes';
import claimRoutes from '../modules/claim/claim.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import userRoutes from '../modules/user/user.routes';

const router = Router();

// Treasure Box Core Routes (App & Dashboard)
router.use('/hunts', huntRoutes);
router.use('/hunt', huntRoutes);
router.use('/claims', claimRoutes);
router.use('/claim', claimRoutes);
router.use('/categories', categoryRoutes);
router.use('/category', categoryRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/user', userRoutes);


// Auth & Shared Routes
router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);
router.use('/payment', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
