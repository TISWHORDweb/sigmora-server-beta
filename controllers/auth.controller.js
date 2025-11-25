import User from '../models/User.model.js';
import { generateToken } from '../utils/generateToken.js';
import { validationResult } from 'express-validator';

// @desc    Register creator
// @route   POST /api/auth/register/creator
// @access  Public
export const registerCreator = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, creatorName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'creator',
      creatorName: creatorName || name
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        creatorName: user.creatorName,
        academyCode: user.academyCode,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register subscriber with academy code
// @route   POST /api/auth/register/subscriber
// @access  Public
export const registerSubscriber = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, academyCode } = req.body;

    // Find creator by academy code
    const creator = await User.findOne({ academyCode, role: 'creator' });
    if (!creator) {
      return res.status(404).json({ message: 'Invalid academy code' });
    }

    // Check if subscriber already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create subscriber
    const user = await User.create({
      name: email.split('@')[0], // Use email prefix as default name
      email,
      password,
      role: 'subscriber',
      subscribedTo: creator._id
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscribedTo: creator._id,
        creatorName: creator.creatorName,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get creator info if subscriber
    let creatorInfo = null;
    if (user.role === 'subscriber' && user.subscribedTo) {
      const creator = await User.findById(user.subscribedTo);
      creatorInfo = {
        _id: creator._id,
        creatorName: creator.creatorName,
        academyCode: creator.academyCode
      };
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      creatorName: user.creatorName,
      academyCode: user.academyCode,
      subscribedTo: user.subscribedTo,
      creatorInfo,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get creator info if subscriber
    let creatorInfo = null;
    if (user.role === 'subscriber' && user.subscribedTo) {
      const creator = await User.findById(user.subscribedTo);
      creatorInfo = {
        _id: creator._id,
        creatorName: creator.creatorName,
        academyCode: creator.academyCode
      };
    }

    res.json({
      ...user.toObject(),
      creatorInfo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

