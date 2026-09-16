import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, databaseConfig } from './config/index.js';
import { validate } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RoleModule } from './modules/role/role.module.js';
import { UserModule } from './modules/users/user.module.js';
import { LaboratoryModule } from './modules/laboratory/laboratory.module.js';
import { FacilityModule } from './modules/facility/facility.module.js';
import { AcademicCalendarModule } from './modules/academic-calendar/academic-calendar.module.js';
import { OperationalHourModule } from './modules/operational-hour/operational-hour.module.js';
import { AnnouncementModule } from './modules/announcement/announcement.module.js';
import { ScheduleModule } from './modules/schedule/schedule.module.js';
import { RoomRequestModule } from './modules/room-request/room-request.module.js';
import { RoomUsageModule } from './modules/room-usage/room-usage.module.js';
import { DisplayModule } from './modules/display/display.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { ReportModule } from './modules/reports/report.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig],
      validate,
    }),
    PrismaModule,
    AuthModule,
    RoleModule,
    UserModule,
    LaboratoryModule,
    FacilityModule,
    AcademicCalendarModule,
    OperationalHourModule,
    AnnouncementModule,
    ScheduleModule,
    RoomRequestModule,
    RoomUsageModule,
    DisplayModule,
    DashboardModule,
    ReportModule,
    NotificationsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
