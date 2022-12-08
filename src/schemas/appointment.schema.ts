import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema()
export class Appointment {
  @Prop()
    date: Date;

  @Prop()
    user: string;

  @Prop()
    doctor: string;

  @Prop()
    active: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
