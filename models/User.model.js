import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['creator', 'subscriber'],
    required: true
  },
  academyCode: {
    type: String,
    unique: true,
    sparse: true // Only for creators
  },
  creatorName: {
    type: String, // Display name like "HappyFX" or "IBFX"
    trim: true
  },
  subscribedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Only for subscribers - references the creator
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate academy code for creators
userSchema.pre('save', async function (next) {
  if (this.role === 'creator' && !this.academyCode) {
    // Generate a unique 6-character code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;
    
    while (!isUnique) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await mongoose.model('User').findOne({ academyCode: code });
      if (!existing) {
        isUnique = true;
      }
    }
    this.academyCode = code;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

