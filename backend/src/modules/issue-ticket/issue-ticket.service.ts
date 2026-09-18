import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { EventsGateway } from '../display/events.gateway.js';
import { CreateIssueTicketDto } from './dto/create-issue-ticket.dto.js';
import { UpdateIssueTicketStatusDto } from './dto/update-issue-ticket-status.dto.js';
import { IssueTicketQueryDto } from './dto/issue-ticket-query.dto.js';
import { ResponseIssueTicketDto } from './dto/response-issue-ticket.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { IssueStatus, IssueSeverity, Prisma } from '@prisma/client';

@Injectable()
export class IssueTicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async generateTicketNumber(): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `TKT-${yyyy}${mm}${dd}`;

    const countToday = await this.prisma.facilityIssueTicket.count({
      where: {
        ticket_number: {
          startsWith: datePrefix,
        },
      },
    });

    const sequence = String(countToday + 1).padStart(3, '0');
    return `${datePrefix}-${sequence}`;
  }

  async create(userId: string, dto: CreateIssueTicketDto): Promise<ResponseIssueTicketDto> {
    const laboratory = await this.prisma.laboratory.findUnique({
      where: { id: dto.laboratory_id },
      select: { id: true, name: true, code: true },
    });

    if (!laboratory) {
      throw new NotFoundException('Laboratorium tidak ditemukan');
    }

    if (dto.facility_id) {
      const facility = await this.prisma.facility.findUnique({
        where: { id: dto.facility_id },
      });
      if (!facility) {
        throw new NotFoundException('Fasilitas / alat tidak ditemukan');
      }
    }

    const ticketNumber = await this.generateTicketNumber();

    const ticket = await this.prisma.facilityIssueTicket.create({
      data: {
        ticket_number: ticketNumber,
        laboratory_id: dto.laboratory_id,
        facility_id: dto.facility_id || null,
        reported_by_id: userId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity || IssueSeverity.MEDIUM,
        status: IssueStatus.REPORTED,
        image_url: dto.image_url || null,
      },
      include: {
        laboratory: { select: { id: true, code: true, name: true, location: true } },
        facility: { select: { id: true, code: true, name: true, category: true } },
        reporter: { select: { id: true, full_name: true, email: true, avatar_url: true } },
      },
    });

    // Notify Admins & Laboran
    try {
      const reporterName = ticket.reporter?.full_name || 'Pengguna Lab';
      await this.notificationsService.notifyAdminsAndLaboran(
        `Laporan Kendala Baru: ${ticket.ticket_number}`,
        `${reporterName} melaporkan kendala "${ticket.title}" di ${laboratory.name}.`,
        'system',
        `/laboran/issue-tickets/${ticket.id}`,
      );
    } catch (err) {
      console.warn('Failed to notify laboran for new issue ticket:', err);
    }

    return ticket;
  }

  async findAll(
    queryDto: IssueTicketQueryDto,
    currentUser: { userId: string; role: string },
  ): Promise<PaginatedResponseDto<ResponseIssueTicketDto>> {
    const { page = 1, limit = 10, search, status, severity, laboratory_id } = queryDto;
    const skip = (page - 1) * limit;

    const where: Prisma.FacilityIssueTicketWhereInput = {};

    if (currentUser.role === 'DOSEN') {
      // Lecturers see tickets they reported
      where.reported_by_id = currentUser.userId;
    }

    if (status) {
      where.status = status;
    }

    if (severity) {
      where.severity = severity;
    }

    if (laboratory_id) {
      where.laboratory_id = laboratory_id;
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { ticket_number: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.facilityIssueTicket.count({ where }),
      this.prisma.facilityIssueTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          laboratory: { select: { id: true, code: true, name: true, location: true } },
          facility: { select: { id: true, code: true, name: true, category: true } },
          reporter: { select: { id: true, full_name: true, email: true, avatar_url: true } },
          handler: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        },
      }),
    ]);

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<ResponseIssueTicketDto> {
    const ticket = await this.prisma.facilityIssueTicket.findUnique({
      where: { id },
      include: {
        laboratory: { select: { id: true, code: true, name: true, location: true } },
        facility: { select: { id: true, code: true, name: true, category: true } },
        reporter: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        handler: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        maintenanceLogs: {
          orderBy: { created_at: 'desc' },
          include: {
            technician: { select: { id: true, full_name: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Tiket kendala tidak ditemukan');
    }

    return ticket;
  }

  async updateStatus(
    id: string,
    dto: UpdateIssueTicketStatusDto,
    handlerUserId: string,
  ): Promise<ResponseIssueTicketDto> {
    const ticket = await this.prisma.facilityIssueTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Tiket kendala tidak ditemukan');
    }

    const isResolving = dto.status === IssueStatus.RESOLVED;

    const updated = await this.prisma.facilityIssueTicket.update({
      where: { id },
      data: {
        status: dto.status,
        handled_by_id: handlerUserId,
        resolution_notes: dto.resolution_notes !== undefined ? dto.resolution_notes : ticket.resolution_notes,
        resolved_at: isResolving ? new Date() : ticket.resolved_at,
      },
      include: {
        laboratory: { select: { id: true, code: true, name: true, location: true } },
        facility: { select: { id: true, code: true, name: true, category: true } },
        reporter: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        handler: { select: { id: true, full_name: true, email: true, avatar_url: true } },
      },
    });

    // Notify the reporter about status update
    try {
      await this.notificationsService.create({
        user_id: updated.reported_by_id,
        title: `Status Tiket ${updated.ticket_number} Diperbarui`,
        message: `Tiket "${updated.title}" kini berstatus ${updated.status}.`,
        category: 'system',
        link_url: `/lecturer/issue-tickets/${updated.id}`,
      });
    } catch (err) {
      console.warn('Failed to notify ticket reporter:', err);
    }

    this.eventsGateway.emitDisplayUpdate('display:sync');

    return updated;
  }
}
