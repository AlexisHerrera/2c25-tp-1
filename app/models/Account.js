import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['ARS', 'USD', 'EUR', 'BRL']
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

const Account = mongoose.model('Account', accountSchema);

export default Account;