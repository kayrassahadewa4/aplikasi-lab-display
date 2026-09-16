import { Module, Global } from '@nestjs/common';
import { DisplayService } from './display.service.js';
import { DisplayController } from './display.controller.js';
import { EventsGateway } from './events.gateway.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [DisplayController],
  providers: [DisplayService, EventsGateway],
  exports: [DisplayService, EventsGateway],
})
export class DisplayModule {}
