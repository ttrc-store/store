import mongoose, { Schema, Document } from 'mongoose';
import { connectToDatabase } from './mongodb/client';

export interface ICounter {
  _id: string; // e.g. 'CUS', 'ORD', 'PRD', 'INV'
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const CounterModel: mongoose.Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Generates an authoritative sequential identifier in the format:
 * TTRC-{ENTITY}-{00001} (5-digit zero-padded sequence starting from 00001)
 *
 * Examples:
 * - Customer: TTRC-CUS-00001
 * - Order:    TTRC-ORD-00001
 * - Invoice:  TTRC-INV-00001
 * - Product:  TTRC-PRD-00001
 */
export async function getNextSequenceId(entity: 'CUS' | 'ORD' | 'INV' | 'PRD' | string): Promise<string> {
  await connectToDatabase();
  const cleanEntity = entity.toUpperCase().trim();

  const counter = await CounterModel.findByIdAndUpdate(
    cleanEntity,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedNumber = String(counter.seq).padStart(5, '0');
  return `TTRC-${cleanEntity}-${paddedNumber}`;
}
