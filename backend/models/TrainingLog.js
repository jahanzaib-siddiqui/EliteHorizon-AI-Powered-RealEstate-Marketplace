import mongoose from 'mongoose';

const trainingLogSchema = new mongoose.Schema({
  logs:       { type: [String], default: [] },
  status:     { type: String, enum: ['done', 'error'], default: 'done' },
  startedAt:  { type: Date },
  finishedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('TrainingLog', trainingLogSchema);
