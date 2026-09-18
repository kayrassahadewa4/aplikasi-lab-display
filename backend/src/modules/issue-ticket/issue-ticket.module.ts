import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { DisplayModule } from '../display/display.module.js';
import { IssueTicketService } from './issue-ticket.service.js';
import { IssueTicketController } from './issue-ticket.controller.js';

@Module({
  imports: [PrismaModule, NotificationsModule, DisplayModule],
  controllers: [IssueTicketController],
  providers: [IssueTicketService],
  exports: [IssueTicketService],
})
export class IssueTicketModule {}
