import { Module } from '@nestjs/common';
import { RoomRequestService } from './room-request.service.js';
import { RoomRequestController } from './room-request.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [RoomRequestController],
  providers: [RoomRequestService],
  exports: [RoomRequestService],
})
export class RoomRequestModule {}
