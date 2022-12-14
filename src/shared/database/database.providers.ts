import * as mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect(process.env.MONGODB_URL),
  },
];
