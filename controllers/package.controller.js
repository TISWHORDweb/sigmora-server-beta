import Package from '../models/Package.model.js';
import { validationResult } from 'express-validator';

// @desc    Create package
// @route   POST /api/packages
// @access  Private/Creator
export const createPackage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, features } = req.body;

    const packageData = await Package.create({
      name,
      description,
      price,
      features: features || [],
      creator: req.user._id
    });

    res.status(201).json(packageData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all packages for creator
// @route   GET /api/packages/creator
// @access  Private/Creator
export const getCreatorPackages = async (req, res) => {
  try {
    const packages = await Package.find({ creator: req.user._id }).sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get packages by creator (for subscribers)
// @route   GET /api/packages/creator/:creatorId
// @access  Public (for viewing before subscription)
export const getPackagesByCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const packages = await Package.find({ creator: creatorId }).sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single package
// @route   GET /api/packages/:id
// @access  Private
export const getPackage = async (req, res) => {
  try {
    const packageData = await Package.findById(req.params.id).populate('creator', 'creatorName email');
    
    if (!packageData) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json(packageData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Private/Creator
export const updatePackage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const packageData = await Package.findById(req.params.id);

    if (!packageData) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Check if creator owns this package
    if (packageData.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, price, features } = req.body;

    packageData.name = name || packageData.name;
    packageData.description = description || packageData.description;
    packageData.price = price !== undefined ? price : packageData.price;
    packageData.features = features || packageData.features;

    const updatedPackage = await packageData.save();
    res.json(updatedPackage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Private/Creator
export const deletePackage = async (req, res) => {
  try {
    const packageData = await Package.findById(req.params.id);

    if (!packageData) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Check if creator owns this package
    if (packageData.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

