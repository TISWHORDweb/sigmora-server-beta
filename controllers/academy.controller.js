import User from '../models/User.model.js';
import Package from '../models/Package.model.js';

// @desc    Get academy code for creator
// @route   GET /api/academy/code
// @access  Private/Creator
export const getAcademyCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || user.role !== 'creator') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      academyCode: user.academyCode,
      creatorName: user.creatorName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get academy info by code (for subscribers to view before joining)
// @route   GET /api/academy/:code
// @access  Public
export const getAcademyByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const creator = await User.findOne({ 
      academyCode: code.toUpperCase(),
      role: 'creator'
    });

    if (!creator) {
      return res.status(404).json({ message: 'Invalid academy code' });
    }

    // Get creator's packages
    const packages = await Package.find({ creator: creator._id })
      .select('name description price features')
      .sort({ createdAt: -1 });

    res.json({
      creator: {
        _id: creator._id,
        creatorName: creator.creatorName,
        academyCode: creator.academyCode
      },
      packages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

