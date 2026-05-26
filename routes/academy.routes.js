import express from 'express';
import {
  getAcademyCode,
  getAcademyByCode,
  getMyAcademy,
} from '../controllers/academy.controller.js';
import { protect, creatorOnly, subscriberOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes
router.get('/code', protect, creatorOnly, getAcademyCode);
router.get('/me', protect, subscriberOnly, getMyAcademy);
router.get('/:code', getAcademyByCode);

export default router;

