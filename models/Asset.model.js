import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  pipValue: {
    type: Number,
    required: true,
    min: 0
  },
  spread: {
    type: Number,
    required: true,
    min: 0
  },
  margin: {
    type: Number,
    required: true,
    min: 0
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

assetSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;

