import mongoose from 'mongoose';

const rateSchema = new mongoose.Schema({
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
  rate: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Crear índice compuesto para buscar tasas por par de monedas
rateSchema.index({ baseCurrency: 1, counterCurrency: 1 }, { unique: true });

const Rate = mongoose.model('Rate', rateSchema);

export default Rate;