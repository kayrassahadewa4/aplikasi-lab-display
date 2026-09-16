import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateLaboratoryDto } from './dto/create-laboratory.dto.js';
import { UpdateLaboratoryDto } from './dto/update-laboratory.dto.js';
import { ResponseLaboratoryDto } from './dto/response-laboratory.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { Prisma } from '@prisma/client';
import { EventsGateway } from '../display/events.gateway.js';

@Injectable()
export class LaboratoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(
    createLaboratoryDto: CreateLaboratoryDto,
  ): Promise<ResponseLaboratoryDto> {
    try {
      // Check if code already exists
      const existingLaboratory = await this.prisma.laboratory.findUnique({
        where: { code: createLaboratoryDto.code },
      });

      if (existingLaboratory) {
        throw new ConflictException(
          `Laboratory with code '${createLaboratoryDto.code}' already exists`,
        );
      }

      const laboratory = await this.prisma.laboratory.create({
        data: createLaboratoryDto,
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'LABORATORY_CREATED',
        id: laboratory.id,
      });

      return laboratory;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create laboratory');
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedResponseDto<ResponseLaboratoryDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.LaboratoryWhereInput = search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [laboratories, total] = await Promise.all([
        this.prisma.laboratory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.laboratory.count({ where }),
      ]);

      return new PaginatedResponseDto(laboratories, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch laboratories');
    }
  }

  async findOne(id: string): Promise<ResponseLaboratoryDto> {
    try {
      const laboratory = await this.prisma.laboratory.findUnique({
        where: { id },
      });

      if (!laboratory) {
        throw new NotFoundException(`Laboratory with ID '${id}' not found`);
      }

      return laboratory;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch laboratory');
    }
  }

  async update(
    id: string,
    updateLaboratoryDto: UpdateLaboratoryDto,
  ): Promise<ResponseLaboratoryDto> {
    try {
      // Check if laboratory exists
      await this.findOne(id);

      // If code is being updated, check for uniqueness
      if (updateLaboratoryDto.code) {
        const existingLaboratory = await this.prisma.laboratory.findUnique({
          where: { code: updateLaboratoryDto.code },
        });

        if (existingLaboratory && existingLaboratory.id !== id) {
          throw new ConflictException(
            `Laboratory with code '${updateLaboratoryDto.code}' already exists`,
          );
        }
      }

      const laboratory = await this.prisma.laboratory.update({
        where: { id },
        data: updateLaboratoryDto,
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'LABORATORY_UPDATED',
        id: laboratory.id,
      });

      return laboratory;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update laboratory');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if laboratory exists
      await this.findOne(id);

      // Check if laboratory is referenced in Schedule
      const scheduleCount = await this.prisma.schedule.count({
        where: { laboratory_id: id },
      });

      if (scheduleCount > 0) {
        throw new ConflictException(
          `Cannot delete laboratory. It is referenced in ${scheduleCount} schedule(s)`,
        );
      }

      // Check if laboratory is referenced in RoomRequest
      const roomRequestCount = await this.prisma.roomRequest.count({
        where: { laboratory_id: id },
      });

      if (roomRequestCount > 0) {
        throw new ConflictException(
          `Cannot delete laboratory. It is referenced in ${roomRequestCount} room request(s)`,
        );
      }

      // Check if laboratory is referenced in OperationalHour
      const operationalHourCount = await this.prisma.operationalHour.count({
        where: { laboratory_id: id },
      });

      if (operationalHourCount > 0) {
        throw new ConflictException(
          `Cannot delete laboratory. It is referenced in ${operationalHourCount} operational hour(s)`,
        );
      }

      // Check if laboratory is referenced in LaboratoryFacility
      const laboratoryFacilityCount =
        await this.prisma.laboratoryFacility.count({
          where: { laboratory_id: id },
        });

      if (laboratoryFacilityCount > 0) {
        throw new ConflictException(
          `Cannot delete laboratory. It is referenced in ${laboratoryFacilityCount} laboratory facility record(s)`,
        );
      }

      // Check if laboratory is referenced in LaboratoryStatusHistory
      const statusHistoryCount =
        await this.prisma.laboratoryStatusHistory.count({
          where: { laboratory_id: id },
        });

      if (statusHistoryCount > 0) {
        throw new ConflictException(
          `Cannot delete laboratory. It is referenced in ${statusHistoryCount} status history record(s)`,
        );
      }

      await this.prisma.laboratory.delete({
        where: { id },
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'LABORATORY_DELETED',
        id,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete laboratory');
    }
  }
}
