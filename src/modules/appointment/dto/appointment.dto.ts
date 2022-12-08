import { IsDateString, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  readonly doctor: string;

  @IsDateString()
  readonly date: Date;
}
