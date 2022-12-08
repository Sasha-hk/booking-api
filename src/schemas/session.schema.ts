import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { User } from 'src/schemas/user.schema';

export type SessionDocument = HydratedDocument<Session>;

@Schema()
export class Session {
  @Prop()
    user: User;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
