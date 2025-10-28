import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

export const typeOrmConfigFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('POSTGRES_HOST'),
  port: configService.get('POSTGRES_PORT'),
  username: configService.get('POSTGRES_USER'),
  password: configService.get('POSTGRES_PASSWORD'),
  database: configService.get('POSTGRES_DB'),
  entities: [join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  synchronize: configService.get('NODE_ENV') === 'development', // Auto-create tables in development
  migrationsRun: false, // Disabled for now - migrations don't work with Webpack
  logging: configService.get('NODE_ENV') === 'development',
  ssl: false, // Disabled for internal Docker network
  autoLoadEntities: true, // Automatically load entities with Webpack - official NestJS recommendation
});

// For TypeORM CLI
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'socialmedia',
  password: process.env.POSTGRES_PASSWORD || 'changeme_secure_password',
  database: process.env.POSTGRES_DB || 'socialmedia',
  entities: [join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
};

export default new DataSource(dataSourceOptions);
