import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Cold Storage: Historical meter telemetry data
 * Append-only table for audit trail and long-term analytics
 */
@Entity('meter_telemetry_history')
@Index(['meterId', 'timestamp'])
@Index(['timestamp'])
export class MeterTelemetryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  meterId: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  kwhConsumedAc: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  voltage: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  ingestedAt: Date;
}
