import express from 'express';
import {
  getAcademyCode,
  getAcademyByCode
} from '../controllers/academy.controller.js';
import { protect, creatorOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes
router.get('/code', protect, creatorOnly, getAcademyCode);
router.get('/:code', getAcademyByCode);

export default router;

