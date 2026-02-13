import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Cold Storage: Historical vehicle telemetry data
 * Append-only table for audit trail and long-term analytics
 */
@Entity('vehicle_telemetry_history')
@Index(['vehicleId', 'timestamp'])
@Index(['timestamp'])
export class VehicleTelemetryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  vehicleId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  soc: number; // State of Charge (0-100%)

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  kwhDeliveredDc: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  batteryTemp: number; // Temperature in Celsius

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  ingestedAt: Date;
}
