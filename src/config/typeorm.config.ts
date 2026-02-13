import { DataSource, DataSourceOptions } from 'typeorm';
import { MeterTelemetryHistory } from '../entities/meter-telemetry-history.entity';
import { VehicleTelemetryHistory } from '../entities/vehicle-telemetry-history.entity';
import { MeterStatus } from '../entities/meter-status.entity';
import { VehicleStatus } from '../entities/vehicle-status.entity';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'energy_ingestion',
  entities: [
    MeterTelemetryHistory,
    VehicleTelemetryHistory,
    MeterStatus,
    VehicleStatus,
  ],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in dev
  logging: process.env.NODE_ENV === 'development',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
};

export default new DataSource(typeOrmConfig);
