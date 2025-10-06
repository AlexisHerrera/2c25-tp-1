import mongoose from 'mongoose';

const transactionLogSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  ts: {
    type: Date,
    required: true,
    default: Date.now
  },
  ok: {
    type: Boolean,
    required: true,
    default: false
  },
  request: {
    baseCurrency: {
      type: String,
      required: true,
      enum: ['ARS', 'USD', 'EUR', 'BRL']
    },
    counterCurrency: {
      type: String,
      required: true,
      enum: ['ARS', 'USD', 'EUR', 'BRL']
    },
    baseAccountId: {
      type: String,
      required: true
    },
    counterAccountId: {
      type: String,
      required: true
    },
    baseAmount: {
      type: Number,
      required: true
    }
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  counterAmount: {
    type: Number,
    required: true,
    default: 0.0
  },
  obs: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);

export default TransactionLog;