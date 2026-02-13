import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Hot Storage: Current meter status
 * Optimized for fast reads of latest meter state
 * Uses UPSERT strategy to avoid scanning history table
 */
@Entity('meter_status')
export class MeterStatus {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  meterId: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  kwhConsumedAc: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  voltage: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
