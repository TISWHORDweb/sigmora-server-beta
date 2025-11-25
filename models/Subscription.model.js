import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
subscriptionSchema.index({ subscriber: 1, status: 1 });
subscriptionSchema.index({ expiryDate: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;

