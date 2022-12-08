import { IsDateString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  readonly doctor: string;

  @IsDateString()
  readonly date: Date;
}
