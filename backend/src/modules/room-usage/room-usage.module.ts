import { Module } from '@nestjs/common';
import { RoomUsageService } from './room-usage.service.js';
import { RoomUsageController } from './room-usage.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RoomUsageController],
  providers: [RoomUsageService],
  exports: [RoomUsageService],
})
export class RoomUsageModule {}
