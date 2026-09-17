import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateFacilityDto } from './dto/create-facility.dto.js';
import { UpdateFacilityDto } from './dto/update-facility.dto.js';
import { ResponseFacilityDto } from './dto/response-facility.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { Prisma } from '@prisma/client';
import { EventsGateway } from '../display/events.gateway.js';

@Injectable()
export class FacilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(
    createFacilityDto: CreateFacilityDto,
  ): Promise<ResponseFacilityDto> {
    try {
      // Check if code already exists
      const existingFacility = await this.prisma.facility.findUnique({
        where: { code: createFacilityDto.code },
      });

      if (existingFacility) {
        throw new ConflictException(
          `Facility with code '${createFacilityDto.code}' already exists`,
        );
      }

      const facility = await this.prisma.facility.create({
        data: createFacilityDto,
        include: {
          laboratoryFacilities: {
            include: {
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
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'FACILITY_CREATED',
        id: facility.id,
      });

      return facility;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create facility');
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedResponseDto<ResponseFacilityDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.FacilityWhereInput = search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [facilities, total] = await Promise.all([
        this.prisma.facility.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            laboratoryFacilities: {
              include: {
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
        }),
        this.prisma.facility.count({ where }),
      ]);

      return new PaginatedResponseDto(facilities, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch facilities');
    }
  }

  async findOne(id: string): Promise<ResponseFacilityDto> {
    try {
      const facility = await this.prisma.facility.findUnique({
        where: { id },
        include: {
          laboratoryFacilities: {
            include: {
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
      });

      if (!facility) {
        throw new NotFoundException(`Facility with ID '${id}' not found`);
      }

      return facility;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch facility');
    }
  }

  async update(
    id: string,
    updateFacilityDto: UpdateFacilityDto,
  ): Promise<ResponseFacilityDto> {
    try {
      // Check if facility exists
      await this.findOne(id);

      // If code is being updated, check for uniqueness
      if (updateFacilityDto.code) {
        const existingFacility = await this.prisma.facility.findUnique({
          where: { code: updateFacilityDto.code },
        });

        if (existingFacility && existingFacility.id !== id) {
          throw new ConflictException(
            `Facility with code '${updateFacilityDto.code}' already exists`,
          );
        }
      }

      const facility = await this.prisma.facility.update({
        where: { id },
        data: updateFacilityDto,
        include: {
          laboratoryFacilities: {
            include: {
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
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'FACILITY_UPDATED',
        id: facility.id,
      });

      return facility;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update facility');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if facility exists
      await this.findOne(id);

      // Check if facility is referenced in LaboratoryFacility
      const laboratoryFacilityCount =
        await this.prisma.laboratoryFacility.count({
          where: { facility_id: id },
        });

      if (laboratoryFacilityCount > 0) {
        throw new ConflictException(
          `Cannot delete facility. It is assigned to ${laboratoryFacilityCount} laboratory/laboratories`,
        );
      }

      await this.prisma.facility.delete({
        where: { id },
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'FACILITY_DELETED',
        id,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete facility');
    }
  }
}
