import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
    email: string;

  @Prop()
    reg_token: string;

  @Prop()
    photo_avatar: string;

  @Prop()
    phone: string;

  @Prop()
    name: string;

  @Prop()
    type: 'user' | 'doc';
}

export const UserSchema = SchemaFactory.createForClass(User);
