import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Hot Storage: Current vehicle status
 * Optimized for fast reads of latest vehicle state
 * Uses UPSERT strategy to avoid scanning history table
 */
@Entity('vehicle_status')
export class VehicleStatus {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  vehicleId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  soc: number; // State of Charge (0-100%)

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  kwhDeliveredDc: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  batteryTemp: number; // Temperature in Celsius

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
