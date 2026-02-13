import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterTelemetryHistory } from '../entities/meter-telemetry-history.entity';
import { VehicleTelemetryHistory } from '../entities/vehicle-telemetry-history.entity';
import { MeterStatus } from '../entities/meter-status.entity';
import { VehicleStatus } from '../entities/vehicle-status.entity';
import { MeterTelemetryDto } from './dto/meter-telemetry.dto';
import { VehicleTelemetryDto } from './dto/vehicle-telemetry.dto';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(MeterTelemetryHistory)
    private meterHistoryRepository: Repository<MeterTelemetryHistory>,
    @InjectRepository(VehicleTelemetryHistory)
    private vehicleHistoryRepository: Repository<VehicleTelemetryHistory>,
    @InjectRepository(MeterStatus)
    private meterStatusRepository: Repository<MeterStatus>,
    @InjectRepository(VehicleStatus)
    private vehicleStatusRepository: Repository<VehicleStatus>,
  ) {}

  /**
   * Ingests meter telemetry data
   * Strategy: INSERT into history (cold) + UPSERT into status (hot)
   */
  async ingestMeterTelemetry(dto: MeterTelemetryDto): Promise<void> {
    const timestamp = new Date(dto.timestamp);

    // Cold Storage: Append-only INSERT for audit trail
    const historyRecord = this.meterHistoryRepository.create({
      meterId: dto.meterId,
      kwhConsumedAc: dto.kwhConsumedAc,
      voltage: dto.voltage,
      timestamp,
    });
    await this.meterHistoryRepository.insert(historyRecord);

    // Hot Storage: UPSERT for fast current status lookup
    await this.meterStatusRepository.upsert(
      {
        meterId: dto.meterId,
        kwhConsumedAc: dto.kwhConsumedAc,
        voltage: dto.voltage,
        timestamp,
      },
      ['meterId'],
    );
  }

  /**
   * Ingests vehicle telemetry data
   * Strategy: INSERT into history (cold) + UPSERT into status (hot)
   */
  async ingestVehicleTelemetry(dto: VehicleTelemetryDto): Promise<void> {
    const timestamp = new Date(dto.timestamp);

    // Cold Storage: Append-only INSERT for audit trail
    const historyRecord = this.vehicleHistoryRepository.create({
      vehicleId: dto.vehicleId,
      soc: dto.soc,
      kwhDeliveredDc: dto.kwhDeliveredDc,
      batteryTemp: dto.batteryTemp,
      timestamp,
    });
    await this.vehicleHistoryRepository.insert(historyRecord);

    // Hot Storage: UPSERT for fast current status lookup
    await this.vehicleStatusRepository.upsert(
      {
        vehicleId: dto.vehicleId,
        soc: dto.soc,
        kwhDeliveredDc: dto.kwhDeliveredDc,
        batteryTemp: dto.batteryTemp,
        timestamp,
      },
      ['vehicleId'],
    );
  }
}
