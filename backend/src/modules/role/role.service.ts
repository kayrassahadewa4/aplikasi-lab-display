import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { ResponseRoleDto } from './dto/response-role.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<ResponseRoleDto> {
    try {
      // Check if role code already exists
      const existingRole = await this.prisma.role.findUnique({
        where: { code: createRoleDto.code },
      });

      if (existingRole) {
        throw new ConflictException(
          `Role with code '${createRoleDto.code}' already exists`,
        );
      }

      const role = await this.prisma.role.create({
        data: createRoleDto,
      });

      return role;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create role');
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedResponseDto<ResponseRoleDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.RoleWhereInput = search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [roles, total] = await Promise.all([
        this.prisma.role.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.role.count({ where }),
      ]);

      return new PaginatedResponseDto(roles, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch roles');
    }
  }

  async findOne(id: string): Promise<ResponseRoleDto> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID '${id}' not found`);
      }

      return role;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch role');
    }
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<ResponseRoleDto> {
    try {
      // Check if role exists
      const existingRole = await this.findOne(id);

      // Core system roles cannot have their codes modified
      const coreRoles = ['ADMIN', 'LABORAN', 'DOSEN'];
      if (
        coreRoles.includes(existingRole.code) &&
        updateRoleDto.code &&
        updateRoleDto.code !== existingRole.code
      ) {
        throw new BadRequestException('Cannot modify code of core system role');
      }

      // If code is being updated, check for uniqueness
      if (updateRoleDto.code) {
        const existingRoleWithCode = await this.prisma.role.findUnique({
          where: { code: updateRoleDto.code },
        });

        if (existingRoleWithCode && existingRoleWithCode.id !== id) {
          throw new ConflictException(
            `Role with code '${updateRoleDto.code}' already exists`,
          );
        }
      }

      const role = await this.prisma.role.update({
        where: { id },
        data: updateRoleDto,
      });

      return role;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update role');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if role exists
      const existingRole = await this.findOne(id);

      // Core system roles cannot be deleted
      const coreRoles = ['ADMIN', 'LABORAN', 'DOSEN'];
      if (coreRoles.includes(existingRole.code)) {
        throw new BadRequestException('Cannot delete core system role');
      }

      // Check if role is being used by any user
      const userCount = await this.prisma.user.count({
        where: { role_id: id },
      });

      if (userCount > 0) {
        throw new ConflictException(
          `Cannot delete role. It is currently assigned to ${userCount} user(s)`,
        );
      }

      await this.prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete role');
    }
  }
}
