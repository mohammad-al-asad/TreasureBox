import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import {
  createNotificationController,
  getAllNotificationsController,
  listMessageLogsController,
  listMyNotificationsController,
  markNotificationReadController
} from './notification.controller';
import { createNotificationSchema } from './notification.validation';

const router = Router();

// Action-Oriented Endpoints
router.get('/get-all-notifications', authenticate, authorizeAdmin, getAllNotificationsController);
router.get('/me', authenticate, listMyNotificationsController);
router.get('/logs', authenticate, authorizeAdmin, listMessageLogsController);
router.patch('/:notificationId/read', authenticate, markNotificationReadController);
router.post('/', authenticate, authorizeAdmin, validateRequest({ body: createNotificationSchema }), createNotificationController);


export default router;
