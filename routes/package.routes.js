import express from 'express';
import { body } from 'express-validator';
import {
  createPackage,
  getCreatorPackages,
  getPackagesByCreator,
  getPackage,
  updatePackage,
  deletePackage
} from '../controllers/package.controller.js';
import { protect, creatorOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation rules
const packageValidation = [
  body('name').trim().notEmpty().withMessage('Package name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
];

// Routes
router.post('/', protect, creatorOnly, packageValidation, createPackage);
router.get('/creator', protect, creatorOnly, getCreatorPackages);
router.get('/creator/:creatorId', getPackagesByCreator);
router.get('/:id', protect, getPackage);
router.put('/:id', protect, creatorOnly, packageValidation, updatePackage);
router.delete('/:id', protect, creatorOnly, deletePackage);

export default router;

