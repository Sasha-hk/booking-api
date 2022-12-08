import { Connection } from 'mongoose';

import { DoctorSchema } from '../../schemas/doctor.schema';

export const doctorProviders = [
  {
    provide: 'DOCTOR_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Doctor', DoctorSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
