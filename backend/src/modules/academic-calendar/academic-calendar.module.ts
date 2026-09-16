import { Module } from '@nestjs/common';
import { AcademicCalendarService } from './academic-calendar.service.js';
import { AcademicCalendarController } from './academic-calendar.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicCalendarController],
  providers: [AcademicCalendarService],
  exports: [AcademicCalendarService],
})
export class AcademicCalendarModule {}
