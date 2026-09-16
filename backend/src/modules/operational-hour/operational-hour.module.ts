import { Module } from '@nestjs/common';
import { OperationalHourService } from './operational-hour.service.js';
import { OperationalHourController } from './operational-hour.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [OperationalHourController],
  providers: [OperationalHourService],
  exports: [OperationalHourService],
})
export class OperationalHourModule {}
