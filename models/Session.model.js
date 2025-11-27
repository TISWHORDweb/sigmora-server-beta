import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired sessions
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Update lastActivity on save
sessionSchema.pre('save', function (next) {
  this.lastActivity = new Date();
  next();
});

// Method to check if session is expired
sessionSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;

