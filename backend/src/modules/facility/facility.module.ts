import { Module } from '@nestjs/common';
import { FacilityService } from './facility.service.js';
import { FacilityController } from './facility.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [FacilityController],
  providers: [FacilityService],
  exports: [FacilityService],
})
export class FacilityModule {}
