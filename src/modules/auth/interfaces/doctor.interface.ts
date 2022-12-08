import { Document } from 'mongoose';

export interface Doctor extends Document {
  readonly free: Boolean,
  readonly specialization: string,
}
