import { IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class VehicleTelemetryDto {
  @IsString()
  vehicleId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  soc: number; // State of Charge (0-100%)

  @IsNumber()
  @Min(0)
  kwhDeliveredDc: number;

  @IsNumber()
  batteryTemp: number; // Temperature in Celsius

  @IsDateString()
  timestamp: string;
}
