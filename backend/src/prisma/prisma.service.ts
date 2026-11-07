import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ensureSchema, seedAll } from './prisma.seeder.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    try {
      await ensureSchema(this);
      await seedAll(this, false);
    } catch (err: any) {
      console.warn('Postgres startup schema check/seeder warning:', err?.message || err);
    }
  }

  async seedInitialData(force = true) {
    await ensureSchema(this);
    return await seedAll(this, force);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
