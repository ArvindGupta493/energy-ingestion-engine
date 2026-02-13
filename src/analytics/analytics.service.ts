import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleTelemetryHistory } from '../entities/vehicle-telemetry-history.entity';
import { MeterTelemetryHistory } from '../entities/meter-telemetry-history.entity';
import { VehicleStatus } from '../entities/vehicle-status.entity';

export interface PerformanceAnalytics {
  vehicleId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalKwhConsumedAc: number;
  totalKwhDeliveredDc: number;
  efficiencyRatio: number;
  averageBatteryTemp: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(VehicleTelemetryHistory)
    private vehicleHistoryRepository: Repository<VehicleTelemetryHistory>,
    @InjectRepository(MeterTelemetryHistory)
    private meterHistoryRepository: Repository<MeterTelemetryHistory>,
    @InjectRepository(VehicleStatus)
    private vehicleStatusRepository: Repository<VehicleStatus>,
  ) {}

  /**
   * Calculates 24-hour performance analytics for a vehicle
   *
   * Strategy:
   * 1. Verify vehicle exists (check hot storage)
   * 2. Query historical data with indexed timestamp range
   * 3. Aggregate AC consumption from meters (correlated by timestamp)
   * 4. Aggregate DC delivery from vehicle history
   * 5. Calculate efficiency ratio and average temperature
   *
   * Performance: Uses indexed queries on timestamp to avoid full table scans
   */
  async getVehiclePerformance(
    vehicleId: string,
  ): Promise<PerformanceAnalytics> {
    // Verify vehicle exists
    const vehicleStatus = await this.vehicleStatusRepository.findOne({
      where: { vehicleId },
    });

    if (!vehicleStatus) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }

    // Calculate 24-hour window
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    // Query vehicle telemetry history (indexed on vehicleId + timestamp)
    const vehicleTelemetry = await this.vehicleHistoryRepository
      .createQueryBuilder('vth')
      .select('SUM(vth.kwhDeliveredDc)', 'totalDc')
      .addSelect('AVG(vth.batteryTemp)', 'avgTemp')
      .where('vth.vehicleId = :vehicleId', { vehicleId })
      .andWhere('vth.timestamp >= :startTime', { startTime })
      .andWhere('vth.timestamp <= :endTime', { endTime })
      .getRawOne();

    // Query meter telemetry for correlation
    // Note: In production, this would use a vehicle-meter mapping table
    // to correlate specific meters with vehicles. For this implementation,
    // we aggregate all meter data in the time window.
    // This assumes meters are charging vehicles during this period.
    // A production enhancement would add a vehicle_meter_mapping table.
    const meterTelemetry = await this.meterHistoryRepository
      .createQueryBuilder('mth')
      .select('SUM(mth.kwhConsumedAc)', 'totalAc')
      .where('mth.timestamp >= :startTime', { startTime })
      .andWhere('mth.timestamp <= :endTime', { endTime })
      .getRawOne();

    const totalKwhDeliveredDc = parseFloat(vehicleTelemetry?.totalDc || '0');
    const totalKwhConsumedAc = parseFloat(meterTelemetry?.totalAc || '0');
    const averageBatteryTemp = parseFloat(vehicleTelemetry?.avgTemp || '0');

    // Calculate efficiency ratio (DC/AC)
    // If no AC data, return 0 efficiency
    const efficiencyRatio =
      totalKwhConsumedAc > 0
        ? (totalKwhDeliveredDc / totalKwhConsumedAc) * 100
        : 0;

    return {
      vehicleId,
      period: {
        start: startTime,
        end: endTime,
      },
      totalKwhConsumedAc,
      totalKwhDeliveredDc,
      efficiencyRatio: parseFloat(efficiencyRatio.toFixed(2)),
      averageBatteryTemp: parseFloat(averageBatteryTemp.toFixed(2)),
    };
  }
}
