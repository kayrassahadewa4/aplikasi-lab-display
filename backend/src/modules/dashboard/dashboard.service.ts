import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  DashboardSummaryDto,
  LaboratoryStatisticDto,
  RequestStatisticDto,
  UsageStatisticDto,
  OccupancyStatisticDto,
} from './dto/response-dashboard.dto.js';
import {
  LaboratoryStatus,
  RequestStatus,
  UsageStatus,
  ScheduleStatus,
} from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get overall dashboard summary
   */
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = new Date().getDay();
    const now = new Date();

    const [
      totalLaboratories,
      activeLaboratories,
      totalSchedules,
      todaySchedules,
      totalRoomRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      currentRoomUsage,
      activeAnnouncements,
    ] = await Promise.all([
      // Total laboratories
      this.prisma.laboratory.count(),

      // Active laboratories (AVAILABLE or IN_USE)
      this.prisma.laboratory.count({
        where: {
          status: {
            in: [LaboratoryStatus.AVAILABLE, LaboratoryStatus.IN_USE],
          },
        },
      }),

      // Total schedules (not cancelled)
      this.prisma.schedule.count({
        where: {
          status: { not: ScheduleStatus.CANCELLED },
        },
      }),

      // Today's schedules
      this.prisma.schedule.count({
        where: {
          day_of_week: dayOfWeek,
          status: { not: ScheduleStatus.CANCELLED },
        },
      }),

      // Total room requests
      this.prisma.roomRequest.count(),

      // Pending requests
      this.prisma.roomRequest.count({
        where: { status: RequestStatus.PENDING },
      }),

      // Approved requests
      this.prisma.roomRequest.count({
        where: { status: RequestStatus.APPROVED },
      }),

      // Rejected requests
      this.prisma.roomRequest.count({
        where: { status: RequestStatus.REJECTED },
      }),

      // Current room usage (CHECKED_IN or IN_USE)
      this.prisma.roomUsage.count({
        where: {
          status: { in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE] },
        },
      }),

      // Active announcements
      this.prisma.announcement.count({
        where: {
          is_active: true,
          start_at: { lte: now },
          end_at: { gte: now },
        },
      }),
    ]);

    return {
      total_laboratories: totalLaboratories,
      active_laboratories: activeLaboratories,
      inactive_laboratories: totalLaboratories - activeLaboratories,
      total_schedules: totalSchedules,
      today_schedules: todaySchedules,
      total_room_requests: totalRoomRequests,
      pending_requests: pendingRequests,
      approved_requests: approvedRequests,
      rejected_requests: rejectedRequests,
      current_room_usage: currentRoomUsage,
      active_announcements: activeAnnouncements,
    };
  }

  /**
   * Helper to calculate duration in hours handling midnight endings and day wraps
   */
  private calculateDurationHours(startTime: Date, endTime: Date): number {
    const startH = startTime.getUTCHours() + startTime.getUTCMinutes() / 60;
    const endH = endTime.getUTCHours() + endTime.getUTCMinutes() / 60;
    if (endH === 0 && endTime.getUTCMinutes() === 0 && startH > 0) {
      // Midnight ending (e.g., 23:00 -> 00:00 or 15:00 -> 00:00)
      return 24 - startH;
    }
    if (endH < startH) {
      return 24 - startH + endH;
    }
    return Math.max(0, endH - startH);
  }

  /**
   * Get laboratory statistics with usage data
   */
  async getLaboratoryStatistics(): Promise<LaboratoryStatisticDto[]> {
    const laboratories = await this.prisma.laboratory.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        operationalHours: true,
      },
      orderBy: { code: 'asc' },
    });

    const statistics = await Promise.all(
      laboratories.map(async (lab) => {
        const [scheduleCount, requestCount, usageCount] = await Promise.all([
          this.prisma.schedule.count({
            where: {
              laboratory_id: lab.id,
              status: { not: ScheduleStatus.CANCELLED },
            },
          }),
          this.prisma.roomRequest.count({
            where: { laboratory_id: lab.id },
          }),
          this.prisma.roomUsage.count({
            where: {
              OR: [
                { request: { laboratory_id: lab.id } },
                { schedule: { laboratory_id: lab.id } },
              ],
            },
          }),
        ]);

        // Calculate occupancy based on operational hours
        const totalWeeklyHours = lab.operationalHours.reduce((sum, oh) => {
          const openTime = new Date(oh.open_time);
          const closeTime = new Date(oh.close_time);
          const hours = this.calculateDurationHours(openTime, closeTime);
          return sum + hours;
        }, 0);

        // Fallback if no operational hours defined for lab (Mon-Fri 07:00-22:00 = 75h)
        const effectiveWeeklyHours = totalWeeklyHours > 0 ? totalWeeklyHours : 75;

        // Estimate occupied hours from schedules
        const schedules = await this.prisma.schedule.findMany({
          where: {
            laboratory_id: lab.id,
            status: { not: ScheduleStatus.CANCELLED },
          },
          select: { start_time: true, end_time: true },
        });

        const occupiedHours = schedules.reduce((sum, schedule) => {
          const start = new Date(schedule.start_time);
          const end = new Date(schedule.end_time);
          return sum + this.calculateDurationHours(start, end);
        }, 0);

        const occupancyPercentage = Math.min(
          100,
          Math.max(0, Math.round((occupiedHours / effectiveWeeklyHours) * 100)),
        );

        return {
          laboratory_id: lab.id,
          laboratory_code: lab.code,
          laboratory_name: lab.name,
          total_schedules: scheduleCount,
          total_requests: requestCount,
          total_usage: usageCount,
          occupancy_percentage: occupancyPercentage,
        };
      }),
    );

    return statistics;
  }

  /**
   * Get request statistics by status
   */
  async getRequestStatistics(): Promise<RequestStatisticDto[]> {
    const totalRequests = await this.prisma.roomRequest.count();

    if (totalRequests === 0) {
      return Object.values(RequestStatus).map((status) => ({
        status,
        count: 0,
        percentage: 0,
      }));
    }

    const statsByStatus = await Promise.all(
      Object.values(RequestStatus).map(async (status) => {
        const count = await this.prisma.roomRequest.count({
          where: { status },
        });
        return {
          status,
          count,
          percentage: Math.round((count / totalRequests) * 100),
        };
      }),
    );

    return statsByStatus;
  }

  /**
   * Get usage statistics
   */
  async getUsageStatistics(): Promise<UsageStatisticDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      todayUsage,
      weeklyUsage,
      monthlyUsage,
      completedUsage,
      ongoingUsage,
      allCompletedUsages,
    ] = await Promise.all([
      // Today usage
      this.prisma.roomUsage.count({
        where: {
          check_in_time: { gte: today, lt: tomorrow },
        },
      }),

      // Weekly usage
      this.prisma.roomUsage.count({
        where: {
          check_in_time: { gte: weekAgo },
        },
      }),

      // Monthly usage
      this.prisma.roomUsage.count({
        where: {
          check_in_time: { gte: monthAgo },
        },
      }),

      // Completed usage
      this.prisma.roomUsage.count({
        where: { status: UsageStatus.CHECKED_OUT },
      }),

      // Ongoing usage
      this.prisma.roomUsage.count({
        where: {
          status: { in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE] },
        },
      }),

      // Get all completed usages for average duration
      this.prisma.roomUsage.findMany({
        where: {
          status: UsageStatus.CHECKED_OUT,
          check_out_time: { not: null },
        },
        select: {
          check_in_time: true,
          check_out_time: true,
        },
      }),
    ]);

    // Calculate average duration
    let averageDuration = 0;
    if (allCompletedUsages.length > 0) {
      const totalDuration = allCompletedUsages.reduce((sum, usage) => {
        if (usage.check_out_time) {
          const duration =
            usage.check_out_time.getTime() - usage.check_in_time.getTime();
          return sum + duration;
        }
        return sum;
      }, 0);
      averageDuration = Math.round(
        totalDuration / allCompletedUsages.length / (1000 * 60),
      ); // Convert to minutes
    }

    return {
      today_usage: todayUsage,
      weekly_usage: weeklyUsage,
      monthly_usage: monthlyUsage,
      average_duration_minutes: averageDuration,
      completed_usage: completedUsage,
      ongoing_usage: ongoingUsage,
    };
  }

  /**
   * Get occupancy statistics per laboratory
   */
  async getOccupancyStatistics(): Promise<OccupancyStatisticDto[]> {
    const laboratories = await this.prisma.laboratory.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        operationalHours: true,
      },
      orderBy: { code: 'asc' },
    });

    const occupancyStats = await Promise.all(
      laboratories.map(async (lab) => {
        // Calculate total available hours per week
        const totalWeeklyHours = lab.operationalHours.reduce((sum, oh) => {
          const openTime = new Date(oh.open_time);
          const closeTime = new Date(oh.close_time);
          const hours = this.calculateDurationHours(openTime, closeTime);
          return sum + hours;
        }, 0);

        // Fallback if no operational hours configured (Mon-Fri 07:00-22:00 = 75h)
        const effectiveWeeklyHours = totalWeeklyHours > 0 ? totalWeeklyHours : 75;

        // Get all active schedules for this lab
        const schedules = await this.prisma.schedule.findMany({
          where: {
            laboratory_id: lab.id,
            status: { not: ScheduleStatus.CANCELLED },
          },
          select: {
            start_time: true,
            end_time: true,
          },
        });

        // Calculate occupied hours from schedules
        const occupiedHours = schedules.reduce((sum, schedule) => {
          const start = new Date(schedule.start_time);
          const end = new Date(schedule.end_time);
          return sum + this.calculateDurationHours(start, end);
        }, 0);

        const occupancyPercentage = Math.min(
          100,
          Math.max(0, Math.round((occupiedHours / effectiveWeeklyHours) * 100)),
        );

        return {
          laboratory_id: lab.id,
          laboratory_code: lab.code,
          laboratory_name: lab.name,
          occupied_hours: Math.round(occupiedHours * 100) / 100,
          available_hours: Math.round(effectiveWeeklyHours * 100) / 100,
          occupancy_percentage: occupancyPercentage,
        };
      }),
    );

    return occupancyStats;
  }
}
