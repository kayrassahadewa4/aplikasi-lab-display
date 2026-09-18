import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventsGateway } from '../display/events.gateway.js';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto.js';
import { MaintenanceLogQueryDto } from './dto/maintenance-log-query.dto.js';
import { ResponseMaintenanceLogDto } from './dto/response-maintenance-log.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { IssueStatus, Prisma } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(userId: string, dto: CreateMaintenanceLogDto): Promise<ResponseMaintenanceLogDto> {
    const laboratory = await this.prisma.laboratory.findUnique({
      where: { id: dto.laboratory_id },
    });
    if (!laboratory) {
      throw new NotFoundException('Laboratorium tidak ditemukan');
    }

    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facility_id },
    });
    if (!facility) {
      throw new NotFoundException('Fasilitas tidak ditemukan');
    }

    // Parse maintenance date
    const maintDate = new Date(dto.maintenance_date);

    // 1. Create maintenance log
    const log = await this.prisma.facilityMaintenanceLog.create({
      data: {
        laboratory_id: dto.laboratory_id,
        facility_id: dto.facility_id,
        performed_by_id: userId,
        issue_ticket_id: dto.issue_ticket_id || null,
        maintenance_type: dto.maintenance_type,
        title: dto.title,
        action_taken: dto.action_taken,
        previous_condition: dto.previous_condition || null,
        resulting_condition: dto.resulting_condition,
        cost: dto.cost !== undefined ? dto.cost : null,
        vendor: dto.vendor || null,
        attachment_url: dto.attachment_url || null,
        maintenance_date: maintDate,
      },
      include: {
        laboratory: { select: { id: true, code: true, name: true, location: true } },
        facility: { select: { id: true, code: true, name: true, category: true } },
        technician: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        issueTicket: { select: { id: true, ticket_number: true, title: true, status: true } },
      },
    });

    // 2. Automatically update LaboratoryFacility condition
    const labFacility = await this.prisma.laboratoryFacility.findUnique({
      where: {
        laboratory_id_facility_id: {
          laboratory_id: dto.laboratory_id,
          facility_id: dto.facility_id,
        },
      },
    });

    if (labFacility) {
      await this.prisma.laboratoryFacility.update({
        where: {
          laboratory_id_facility_id: {
            laboratory_id: dto.laboratory_id,
            facility_id: dto.facility_id,
          },
        },
        data: {
          condition: dto.resulting_condition,
        },
      });
    }

    // 3. If linked to an issue ticket, auto-resolve it
    if (dto.issue_ticket_id) {
      await this.prisma.facilityIssueTicket.update({
        where: { id: dto.issue_ticket_id },
        data: {
          status: IssueStatus.RESOLVED,
          handled_by_id: userId,
          resolved_at: new Date(),
          resolution_notes: `Diselesaikan melalui pemeliharaan: "${dto.title}". Tindakan: ${dto.action_taken}`,
        },
      });
    }

    // 4. Emit live update via WebSocket to Display Page
    this.eventsGateway.emitDisplayUpdate('display:sync');

    return {
      ...log,
      cost: log.cost ? Number(log.cost) : null,
    };
  }

  async findAll(queryDto: MaintenanceLogQueryDto): Promise<PaginatedResponseDto<ResponseMaintenanceLogDto>> {
    const { page = 1, limit = 10, search, maintenance_type, laboratory_id, facility_id } = queryDto;
    const skip = (page - 1) * limit;

    const where: Prisma.FacilityMaintenanceLogWhereInput = {};

    if (maintenance_type) {
      where.maintenance_type = maintenance_type;
    }

    if (laboratory_id) {
      where.laboratory_id = laboratory_id;
    }

    if (facility_id) {
      where.facility_id = facility_id;
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { action_taken: { contains: search.trim(), mode: 'insensitive' } },
        { vendor: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.facilityMaintenanceLog.count({ where }),
      this.prisma.facilityMaintenanceLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { maintenance_date: 'desc' },
        include: {
          laboratory: { select: { id: true, code: true, name: true, location: true } },
          facility: { select: { id: true, code: true, name: true, category: true } },
          technician: { select: { id: true, full_name: true, email: true, avatar_url: true } },
          issueTicket: { select: { id: true, ticket_number: true, title: true, status: true } },
        },
      }),
    ]);

    const formattedData = data.map((item) => ({
      ...item,
      cost: item.cost ? Number(item.cost) : null,
    }));

    return new PaginatedResponseDto(formattedData, total, page, limit);
  }

  async findOne(id: string): Promise<ResponseMaintenanceLogDto> {
    const log = await this.prisma.facilityMaintenanceLog.findUnique({
      where: { id },
      include: {
        laboratory: { select: { id: true, code: true, name: true, location: true } },
        facility: { select: { id: true, code: true, name: true, category: true } },
        technician: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        issueTicket: { select: { id: true, ticket_number: true, title: true, status: true } },
      },
    });

    if (!log) {
      throw new NotFoundException('Log pemeliharaan tidak ditemukan');
    }

    return {
      ...log,
      cost: log.cost ? Number(log.cost) : null,
    };
  }
}
