import { Module } from '@nestjs/common';
import { LaboratoryService } from './laboratory.service.js';
import { LaboratoryController } from './laboratory.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [LaboratoryController],
  providers: [LaboratoryService],
  exports: [LaboratoryService],
})
export class LaboratoryModule {}
