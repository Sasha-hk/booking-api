import { Connection } from 'mongoose';

import { AppointmentSchema } from '../../../schemas/appointment.schema';

export const appointmentProviders = [
  {
    provide: 'APPOINTMENT_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Appointment', AppointmentSchema),
    inject: ['DATABASE_CONNECTION'],
    strictQuery: false,
  },
];
