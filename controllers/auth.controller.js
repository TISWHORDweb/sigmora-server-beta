import crypto from 'crypto';
import User from '../models/User.model.js';
import Session from '../models/Session.model.js';
import { generateToken } from '../utils/generateToken.js';
import { ensureCreatorFreePackage } from '../utils/ensureCreatorFreePackage.js';
import { validationResult } from 'express-validator';

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

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
      await ensureCreatorFreePackage(user._id);

      // Generate token
      const token = generateToken(user._id);
      
      // Create session (expires in 5 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 5);
      
      await Session.create({
        user: user._id,
        token,
        expiresAt,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        creatorName: user.creatorName,
        academyCode: user.academyCode,
        token,
        expiresAt
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

    const { name, email, password, academyCode } = req.body;

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
      name: name?.trim() || email.split('@')[0],
      email,
      password,
      role: 'subscriber',
      subscribedTo: creator._id
    });

    if (user) {
      // Generate token
      const token = generateToken(user._id);
      
      // Create session (expires in 5 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 5);
      
      await Session.create({
        user: user._id,
        token,
        expiresAt,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscribedTo: creator._id,
        creatorName: creator.creatorName,
        token,
        expiresAt
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    const message =
      'If an account exists with that email, password reset instructions have been sent.';

    if (!user) {
      return res.json({ message });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashResetToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    const payload = { message };
    if (process.env.NODE_ENV === 'development') {
      payload.resetUrl = resetUrl;
    }

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const hashedToken = hashResetToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await Session.updateMany({ user: user._id }, { isActive: false });

    res.json({ message: 'Password reset successful. You can sign in with your new password.' });
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

    // Generate token
    const token = generateToken(user._id);
    
    // Create session (expires in 5 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 5);
    
    await Session.create({
      user: user._id,
      token,
      expiresAt,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      creatorName: user.creatorName,
      academyCode: user.academyCode,
      subscribedTo: user.subscribedTo,
      creatorInfo,
      token,
      expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, creatorName } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name.trim();
    if (user.role === 'creator' && creatorName !== undefined) {
      user.creatorName = creatorName.trim();
    }

    await user.save();

    const updated = await User.findById(user._id).select('-password');
    let creatorInfo = null;
    if (updated.role === 'subscriber' && updated.subscribedTo) {
      const creator = await User.findById(updated.subscribedTo);
      creatorInfo = {
        _id: creator._id,
        creatorName: creator.creatorName,
        academyCode: creator.academyCode,
      };
    }

    res.json({ ...updated.toObject(), creatorInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password (logged in)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
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
      creatorInfo,
      sessionExpiresAt: req.session?.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user (invalidate session)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Deactivate session
      await Session.updateOne(
        { token, user: req.user._id },
        { isActive: false }
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAll = async (req, res) => {
  try {
    // Deactivate all sessions for user
    await Session.updateMany(
      { user: req.user._id },
      { isActive: false }
    );

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
export const refreshToken = async (req, res) => {
  try {
    // Get current token
    const oldToken = req.headers.authorization?.split(' ')[1];
    
    if (!oldToken) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Find and deactivate old session
    const oldSession = await Session.findOne({ 
      token: oldToken, 
      user: req.user._id 
    });

    if (oldSession) {
      oldSession.isActive = false;
      await oldSession.save();
    }

    // Generate new token
    const newToken = generateToken(req.user._id);
    
    // Create new session (expires in 5 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 5);
    
    await Session.create({
      user: req.user._id,
      token: newToken,
      expiresAt,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      token: newToken,
      expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

