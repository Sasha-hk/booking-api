import * as mongoose from 'mongoose';

export const DoctorSchema = new mongoose.Schema({
  free: Boolean,
  specialization: String,
}, { timestamps: true });
