import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { ReportFilterDto } from './dto/report-filters.dto.js';
import {
  UsageReportDto,
  RequestReportDto,
  ScheduleReportDto,
  LaboratoryReportDto,
  SummaryReportDto,
} from './dto/report-response.dto.js';
import {
  Prisma,
  UsageStatus,
  RequestStatus,
  ScheduleStatus,
  LaboratoryStatus,
} from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build filter conditions for room usage queries
   */
  private buildUsageFilters(filters: ReportFilterDto): Prisma.RoomUsageWhereInput {
    const where: Prisma.RoomUsageWhereInput = {};

    if (filters.start_date || filters.end_date) {
      where.check_in_time = {};
      if (filters.start_date) {
        where.check_in_time.gte = new Date(filters.start_date);
      }
      if (filters.end_date) {
        where.check_in_time.lte = new Date(filters.end_date);
      }
    }

    if (filters.status) {
      where.status = filters.status as UsageStatus;
    }

    if (filters.user_id) {
      where.OR = [
        { checked_in_by: filters.user_id },
        { checked_out_by: filters.user_id },
      ];
    }

    if (filters.room_request_id) {
      where.request_id = filters.room_request_id;
    }

    if (filters.schedule_id) {
      where.schedule_id = filters.schedule_id;
    }

    if (filters.laboratory_id) {
      where.OR = [
        { request: { laboratory_id: filters.laboratory_id } },
        { schedule: { laboratory_id: filters.laboratory_id } },
      ];
    }

    if (filters.search) {
      where.OR = [
        { checkedInBy: { full_name: { contains: filters.search, mode: 'insensitive' } } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Build filter conditions for room request queries
   */
  private buildRequestFilters(filters: ReportFilterDto): Prisma.RoomRequestWhereInput {
    const where: Prisma.RoomRequestWhereInput = {};

    if (filters.start_date || filters.end_date) {
      where.request_date = {};
      if (filters.start_date) {
        where.request_date.gte = new Date(filters.start_date);
      }
      if (filters.end_date) {
        where.request_date.lte = new Date(filters.end_date);
      }
    }

    if (filters.status) {
      where.status = filters.status as RequestStatus;
    }

    if (filters.user_id) {
      where.OR = [
        { applicant_id: filters.user_id },
        { approved_by: filters.user_id },
      ];
    }

    if (filters.laboratory_id) {
      where.laboratory_id = filters.laboratory_id;
    }

    if (filters.search) {
      where.OR = [
        { activity_name: { contains: filters.search, mode: 'insensitive' } },
        { course_name: { contains: filters.search, mode: 'insensitive' } },
        { applicant: { full_name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  /**
   * Build filter conditions for schedule queries
   */
  private buildScheduleFilters(filters: ReportFilterDto): Prisma.ScheduleWhereInput {
    const where: Prisma.ScheduleWhereInput = {};

    if (filters.status) {
      where.status = filters.status as ScheduleStatus;
    }

    if (filters.laboratory_id) {
      where.laboratory_id = filters.laboratory_id;
    }

    if (filters.search) {
      where.OR = [
        { course_name: { contains: filters.search, mode: 'insensitive' } },
        { lecturer_name: { contains: filters.search, mode: 'insensitive' } },
        { class_name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Get usage report with filters and pagination
   */
  async getUsageReport(
    filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<UsageReportDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where = this.buildUsageFilters(filters);

    const [usages, total] = await Promise.all([
      this.prisma.roomUsage.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ check_in_time: 'desc' }],
        select: {
          id: true,
          check_in_time: true,
          check_out_time: true,
          status: true,
          checkedInBy: {
            select: { id: true, full_name: true, email: true },
          },
          request: {
            select: {
              id: true,
              activity_name: true,
              laboratory: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          schedule: {
            select: {
              id: true,
              course_name: true,
              lecturer_name: true,
              laboratory: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.roomUsage.count({ where }),
    ]);

    const data = usages.map((usage) => {
      const duration =
        usage.check_out_time && usage.check_in_time
          ? Math.round(
              (usage.check_out_time.getTime() - usage.check_in_time.getTime()) /
                (1000 * 60),
            )
          : 0;

      const laboratory = usage.request?.laboratory || usage.schedule?.laboratory || null;

      return {
        id: usage.id,
        laboratory,
        user: usage.checkedInBy,
        schedule: usage.schedule
          ? {
              id: usage.schedule.id,
              course_name: usage.schedule.course_name,
              lecturer_name: usage.schedule.lecturer_name,
            }
          : null,
        request: usage.request
          ? {
              id: usage.request.id,
              activity_name: usage.request.activity_name,
            }
          : null,
        check_in_time: usage.check_in_time,
        check_out_time: usage.check_out_time,
        duration_minutes: duration,
        status: usage.status,
      };
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Get request report with filters and pagination
   */
  async getRequestReport(
    filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<RequestReportDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where = this.buildRequestFilters(filters);

    const [requests, total] = await Promise.all([
      this.prisma.roomRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ request_date: 'desc' }],
        select: {
          id: true,
          activity_name: true,
          course_name: true,
          class_name: true,
          request_date: true,
          start_time: true,
          end_time: true,
          approved_at: true,
          status: true,
          applicant: {
            select: { id: true, full_name: true, email: true },
          },
          approver: {
            select: { id: true, full_name: true },
          },
          laboratory: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      this.prisma.roomRequest.count({ where }),
    ]);

    const data = requests.map((request) => ({
      id: request.id,
      applicant: request.applicant,
      laboratory: request.laboratory,
      activity_name: request.activity_name,
      course_name: request.course_name,
      class_name: request.class_name,
      request_date: request.request_date,
      start_time: request.start_time,
      end_time: request.end_time,
      approval_date: request.approved_at,
      approved_by: request.approver,
      status: request.status,
    }));

    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Get schedule report with filters and pagination
   */
  async getScheduleReport(
    filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<ScheduleReportDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where = this.buildScheduleFilters(filters);

    const [schedules, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
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
            select: { id: true, code: true, name: true },
          },
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return new PaginatedResponseDto(schedules, total, page, limit);
  }

  /**
   * Get laboratory report with statistics
   */
  async getLaboratoryReport(
    filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<LaboratoryReportDto>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LaboratoryWhereInput = {};

    if (filters.status) {
      where.status = filters.status as LaboratoryStatus;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [laboratories, total] = await Promise.all([
      this.prisma.laboratory.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ code: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          location: true,
          maximum_capacity: true,
          status: true,
        },
      }),
      this.prisma.laboratory.count({ where }),
    ]);

    const data = await Promise.all(
      laboratories.map(async (lab) => {
        const [scheduleCount, requestCount, usageCount] = await Promise.all([
          this.prisma.schedule.count({ where: { laboratory_id: lab.id } }),
          this.prisma.roomRequest.count({ where: { laboratory_id: lab.id } }),
          this.prisma.roomUsage.count({
            where: {
              OR: [
                { request: { laboratory_id: lab.id } },
                { schedule: { laboratory_id: lab.id } },
              ],
            },
          }),
        ]);

        return {
          ...lab,
          total_schedules: scheduleCount,
          total_requests: requestCount,
          total_usages: usageCount,
        };
      }),
    );

    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Get summary report with aggregated data
   */
  async getSummaryReport(filters: ReportFilterDto): Promise<SummaryReportDto> {
    const dateFilter: Prisma.ScheduleWhereInput = {};
    const requestDateFilter: Prisma.RoomRequestWhereInput = {};
    const usageDateFilter: Prisma.RoomUsageWhereInput = {};

    if (filters.start_date || filters.end_date) {
      if (filters.start_date || filters.end_date) {
        requestDateFilter.request_date = {};
        if (filters.start_date) {
          requestDateFilter.request_date.gte = new Date(filters.start_date);
        }
        if (filters.end_date) {
          requestDateFilter.request_date.lte = new Date(filters.end_date);
        }
      }

      if (filters.start_date || filters.end_date) {
        usageDateFilter.check_in_time = {};
        if (filters.start_date) {
          usageDateFilter.check_in_time.gte = new Date(filters.start_date);
        }
        if (filters.end_date) {
          usageDateFilter.check_in_time.lte = new Date(filters.end_date);
        }
      }
    }

    const [
      totalSchedules,
      totalRequests,
      approvedRequests,
      rejectedRequests,
      pendingRequests,
      completedUsages,
      ongoingUsages,
      activeLaboratories,
      totalLaboratories,
      allSchedules,
      allLaboratories,
    ] = await Promise.all([
      this.prisma.schedule.count({ where: dateFilter }),
      this.prisma.roomRequest.count({ where: requestDateFilter }),
      this.prisma.roomRequest.count({
        where: { ...requestDateFilter, status: RequestStatus.APPROVED },
      }),
      this.prisma.roomRequest.count({
        where: { ...requestDateFilter, status: RequestStatus.REJECTED },
      }),
      this.prisma.roomRequest.count({
        where: { ...requestDateFilter, status: RequestStatus.PENDING },
      }),
      this.prisma.roomUsage.count({
        where: { ...usageDateFilter, status: UsageStatus.CHECKED_OUT },
      }),
      this.prisma.roomUsage.count({
        where: {
          ...usageDateFilter,
          status: { in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE] },
        },
      }),
      this.prisma.laboratory.count({
        where: {
          status: { in: [LaboratoryStatus.AVAILABLE, LaboratoryStatus.IN_USE] },
        },
      }),
      this.prisma.laboratory.count(),
      this.prisma.schedule.findMany({
        where: { status: { not: ScheduleStatus.CANCELLED } },
        select: { start_time: true, end_time: true },
      }),
      this.prisma.laboratory.findMany({
        select: {
          operationalHours: {
            select: { open_time: true, close_time: true },
          },
        },
      }),
    ]);

    // Calculate occupancy percentage
    let occupancyPercentage = 0;
    const totalWeeklyHours = allLaboratories.reduce((sum, lab) => {
      return (
        sum +
        lab.operationalHours.reduce((labSum, oh) => {
          const openTime = new Date(oh.open_time);
          const closeTime = new Date(oh.close_time);
          const hours =
            (closeTime.getTime() - openTime.getTime()) / (1000 * 60 * 60);
          return labSum + hours;
        }, 0)
      );
    }, 0);

    const occupiedHours = allSchedules.reduce((sum, schedule) => {
      const start = new Date(schedule.start_time);
      const end = new Date(schedule.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    if (totalWeeklyHours > 0) {
      occupancyPercentage = Math.round(
        (occupiedHours / totalWeeklyHours) * 100,
      );
    }

    return {
      total_schedules: totalSchedules,
      total_requests: totalRequests,
      approved_requests: approvedRequests,
      rejected_requests: rejectedRequests,
      pending_requests: pendingRequests,
      completed_usages: completedUsages,
      ongoing_usages: ongoingUsages,
      active_laboratories: activeLaboratories,
      inactive_laboratories: totalLaboratories - activeLaboratories,
      occupancy_percentage: occupancyPercentage,
    };
  }
}
