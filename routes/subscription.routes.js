import express from 'express';
import {
  getSubscriptions,
  getSubscriptionStatus,
  getCreatorSubscriptions,
  subscribeToPackage,
} from '../controllers/subscription.controller.js';
import { protect, creatorOnly, subscriberOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes
router.get('/', protect, subscriberOnly, getSubscriptions);
router.post('/subscribe', protect, subscriberOnly, subscribeToPackage);
router.get('/status', protect, subscriberOnly, getSubscriptionStatus);
router.get('/creator', protect, creatorOnly, getCreatorSubscriptions);

export default router;

