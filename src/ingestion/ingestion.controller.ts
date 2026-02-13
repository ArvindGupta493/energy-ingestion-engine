import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { MeterTelemetryDto } from './dto/meter-telemetry.dto';
import { VehicleTelemetryDto } from './dto/vehicle-telemetry.dto';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('meter')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestMeterTelemetry(@Body() dto: MeterTelemetryDto): Promise<{
    status: string;
    message: string;
  }> {
    await this.ingestionService.ingestMeterTelemetry(dto);
    return {
      status: 'accepted',
      message: 'Meter telemetry ingested successfully',
    };
  }

  @Post('vehicle')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestVehicleTelemetry(@Body() dto: VehicleTelemetryDto): Promise<{
    status: string;
    message: string;
  }> {
    await this.ingestionService.ingestVehicleTelemetry(dto);
    return {
      status: 'accepted',
      message: 'Vehicle telemetry ingested successfully',
    };
  }
}
