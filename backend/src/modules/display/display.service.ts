import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  DisplayAnnouncementDto,
  DisplayLaboratoryDto,
  DisplayScheduleDto,
  DisplayRoomRequestDto,
  DisplayRoomUsageDto,
  AggregatedDisplayDto,
} from './dto/display-response.dto.js';
import { RequestStatus, UsageStatus, ScheduleStatus, LaboratoryStatus } from '@prisma/client';

@Injectable()
export class DisplayService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find active announcements (is_active=true AND current time between start_at and end_at)
   */
  async findActiveAnnouncements(): Promise<DisplayAnnouncementDto[]> {
    const now = new Date();

    const announcements = await this.prisma.announcement.findMany({
      where: {
        is_active: true,
        start_at: { lte: now },
        end_at: { gte: now },
      },
      select: {
        id: true,
        title: true,
        content: true,
        start_at: true,
        end_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return announcements;
  }

  /**
   * Find all laboratories with current status
   */
  async findLaboratoryStatus(): Promise<DisplayLaboratoryDto[]> {
    const laboratories = await this.prisma.laboratory.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        maximum_capacity: true,
        image: true,
        status: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return laboratories;
  }

  async findTodaySchedules(): Promise<DisplayScheduleDto[]> {
    const today = new Date();
    // Get Jakarta WIB day of week (0=Sunday, 1=Monday... 6=Saturday)
    const jakartaDateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      weekday: 'short',
    }).format(today);
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dayOfWeek = dayMap[jakartaDateStr] ?? today.getDay();

    const schedules = await this.prisma.schedule.findMany({
      where: {
        day_of_week: dayOfWeek,
        status: {
          not: ScheduleStatus.CANCELLED,
        },
      },
      select: {
        id: true,
        course_name: true,
        lecturer_name: true,
        class_name: true,
        day_of_week: true,
        start_time: true,
        end_time: true,
        status: true,
        laboratory: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        start_time: 'asc',
      },
    });

    return schedules;
  }

  /**
   * Find approved room requests for today (Jakarta WIB timezone-aware)
   */
  async findApprovedRequestsToday(): Promise<DisplayRoomRequestDto[]> {
    // Use Jakarta WIB timezone to determine "today", consistent with findTodaySchedules()
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // en-CA format gives YYYY-MM-DD
    const jakartaDateStr = jakartaFormatter.format(now); // e.g. "2026-09-07"
    const [year, month, day] = jakartaDateStr.split('-').map(Number);

    // Construct WIB day boundaries as UTC timestamps
    // WIB = UTC+7, so WIB 00:00:00 = UTC previous day 17:00:00
    const todayStartWIB = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
    const todayEndWIB = new Date(Date.UTC(year, month - 1, day, -7 + 23, 59, 59, 999));

    const requests = await this.prisma.roomRequest.findMany({
      where: {
        status: RequestStatus.APPROVED,
        request_date: {
          gte: todayStartWIB,
          lte: todayEndWIB,
        },
      },
      select: {
        id: true,
        activity_name: true,
        course_name: true,
        class_name: true,
        request_date: true,
        start_time: true,
        end_time: true,
        participant_count: true,
        applicant: {
          select: {
            id: true,
            full_name: true,
          },
        },
        laboratory: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        start_time: 'asc',
      },
    });

    return requests;
  }

  /**
   * Find current room usage (checked in or in use)
   */
  async findCurrentUsage(): Promise<DisplayRoomUsageDto[]> {
    const usages = await this.prisma.roomUsage.findMany({
      where: {
        status: {
          in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE],
        },
      },
      select: {
        id: true,
        check_in_time: true,
        check_out_time: true,
        status: true,
        notes: true,
        checkedInBy: {
          select: {
            id: true,
            full_name: true,
          },
        },
        request: {
          select: {
            activity_name: true,
            start_time: true,
            end_time: true,
            laboratory: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        schedule: {
          select: {
            course_name: true,
            start_time: true,
            end_time: true,
            laboratory: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        check_in_time: 'desc',
      },
    });

    return usages;
  }

  /**
   * Automatically force-checkout any room usage whose scheduled end time has passed,
   * ensuring that laboratories are freed and returned to AVAILABLE status.
   */
  async forceCheckoutExpiredUsages(): Promise<void> {
    try {
      const now = new Date();
      // Get current Jakarta WIB day of week & current time in minutes
      const jakartaTimeFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const [hStr, mStr] = jakartaTimeFormatter.format(now).split(':');
      const currentJakartaMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);

      const jakartaDayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
      });
      const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };
      const currentDayOfWeek = dayMap[jakartaDayFormatter.format(now)] ?? now.getDay();

      // Get today's start date in Jakarta WIB
      const jakartaDateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const [year, month, day] = jakartaDateFormatter.format(now).split('-').map(Number);
      const todayStartWIB = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));

      // Find all active room usages
      const activeUsages = await this.prisma.roomUsage.findMany({
        where: {
          status: { in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE] },
        },
        include: {
          schedule: true,
          request: true,
        },
      });

      const expiredUsageIds: string[] = [];
      const affectedLabIds = new Set<string>();

      for (const usage of activeUsages) {
        let isExpired = false;

        if (usage.request) {
          const reqDate = new Date(usage.request.request_date);
          if (reqDate < todayStartWIB) {
            isExpired = true;
          } else {
            // If request is today, check end_time
            const endD = new Date(usage.request.end_time);
            const endMin = endD.getUTCHours() * 60 + endD.getUTCMinutes();
            if (currentJakartaMinutes >= endMin) {
              isExpired = true;
            }
          }
          if (usage.request.laboratory_id) {
            affectedLabIds.add(usage.request.laboratory_id);
          }
        } else if (usage.schedule) {
          if (usage.schedule.day_of_week !== currentDayOfWeek) {
            isExpired = true;
          } else {
            const endD = new Date(usage.schedule.end_time);
            const endMin = endD.getUTCHours() * 60 + endD.getUTCMinutes();
            if (currentJakartaMinutes >= endMin) {
              isExpired = true;
            }
          }
          if (usage.schedule.laboratory_id) {
            affectedLabIds.add(usage.schedule.laboratory_id);
          }
        } else {
          // Standalone check-in: if checked in on an earlier date or over 3 hours ago
          const checkInDate = new Date(usage.check_in_time);
          if (
            checkInDate < todayStartWIB ||
            now.getTime() - checkInDate.getTime() > 3 * 3600 * 1000
          ) {
            isExpired = true;
          }
        }

        if (isExpired) {
          expiredUsageIds.push(usage.id);
        }
      }

      if (expiredUsageIds.length > 0) {
        await this.prisma.roomUsage.updateMany({
          where: { id: { in: expiredUsageIds } },
          data: {
            status: UsageStatus.CHECKED_OUT,
            check_out_time: now,
          },
        });

        for (const labId of affectedLabIds) {
          const remainingUsage = await this.prisma.roomUsage.findFirst({
            where: {
              status: { in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE] },
              OR: [
                { request: { laboratory_id: labId } },
                { schedule: { laboratory_id: labId } },
              ],
            },
          });

          if (!remainingUsage) {
            await this.prisma.laboratory.update({
              where: { id: labId },
              data: { status: LaboratoryStatus.AVAILABLE },
            });
          }
        }
      }

      // Check any laboratory marked as IN_USE without active usage right now
      const inUseLabs = await this.prisma.laboratory.findMany({
        where: { status: LaboratoryStatus.IN_USE },
        select: { id: true },
      });

      for (const lab of inUseLabs) {
        const activeUsage = await this.prisma.roomUsage.findFirst({
          where: {
            status: { in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE] },
            OR: [
              { request: { laboratory_id: lab.id } },
              { schedule: { laboratory_id: lab.id } },
            ],
          },
        });

        if (!activeUsage) {
          await this.prisma.laboratory.update({
            where: { id: lab.id },
            data: { status: LaboratoryStatus.AVAILABLE },
          });
        }
      }
    } catch (err) {
      console.warn('forceCheckoutExpiredUsages error:', err);
    }
  }

  /**
   * Aggregate all display data in one response
   */
  async aggregateDisplayData(): Promise<AggregatedDisplayDto> {
    // 1. Force stop and checkout any expired room usages and free up laboratories
    await this.forceCheckoutExpiredUsages();

    // 2. Execute all queries in parallel for performance
    const [announcements, laboratories, schedules, roomRequests, roomUsage] =
      await Promise.all([
        this.findActiveAnnouncements(),
        this.findLaboratoryStatus(),
        this.findTodaySchedules(),
        this.findApprovedRequestsToday(),
        this.findCurrentUsage(),
      ]);

    return {
      server_time: new Date(),
      announcements,
      laboratories,
      schedules,
      room_requests: roomRequests,
      room_usage: roomUsage,
    };
  }
}
