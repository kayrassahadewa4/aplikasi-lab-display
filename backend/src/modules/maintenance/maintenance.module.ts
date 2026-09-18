import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { DisplayModule } from '../display/display.module.js';
import { MaintenanceService } from './maintenance.service.js';
import { MaintenanceController } from './maintenance.controller.js';

@Module({
  imports: [PrismaModule, DisplayModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
