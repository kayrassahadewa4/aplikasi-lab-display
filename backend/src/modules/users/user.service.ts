import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResponseUserDto } from './dto/response-user.dto.js';
import { ResolveResetRequestDto, ResolveAction, DirectResetPasswordDto } from './dto/resolve-reset-request.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    try {
      // Check if role exists
      const role = await this.prisma.role.findUnique({
        where: { id: createUserDto.role_id },
      });

      if (!role) {
        throw new NotFoundException(
          `Role with ID '${createUserDto.role_id}' not found`,
        );
      }

      // Check if email already exists
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingEmail) {
        throw new ConflictException(
          `User with email '${createUserDto.email}' already exists`,
        );
      }

      // Check if keycloak_id already exists (only if provided)
      if (createUserDto.keycloak_id) {
        const existingKeycloakId = await this.prisma.user.findUnique({
          where: { keycloak_id: createUserDto.keycloak_id },
        });

        if (existingKeycloakId) {
          throw new ConflictException(
            `User with keycloak_id '${createUserDto.keycloak_id}' already exists`,
          );
        }
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
          keycloak_id: createUserDto.keycloak_id || null,
        },
        include: {
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return userWithoutPassword as ResponseUserDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
    role_id?: string,
    status?: 'ACTIVE' | 'INACTIVE',
  ): Promise<PaginatedResponseDto<ResponseUserDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {};

      // Build where conditions
      const conditions: Prisma.UserWhereInput[] = [];

      if (search) {
        conditions.push({
          OR: [
            { full_name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        });
      }

      if (role_id) {
        conditions.push({ role_id });
      }

      if (status) {
        conditions.push({ status });
      }

      if (conditions.length > 0) {
        where.AND = conditions;
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            role_id: true,
            keycloak_id: true,
            full_name: true,
            email: true,
            phone: true,
            avatar_url: true,
            status: true,
            created_at: true,
            updated_at: true,
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return new PaginatedResponseDto(users as ResponseUserDto[], total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<ResponseUserDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          role_id: true,
          keycloak_id: true,
          full_name: true,
          email: true,
          phone: true,
          avatar_url: true,
          status: true,
          created_at: true,
          updated_at: true,
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      return user as ResponseUserDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId?: string,
  ): Promise<ResponseUserDto> {
    try {
      // Check if user exists
      const existingUser = await this.findOne(id);

      // Protect sole active administrator from deactivation or demotion
      if (existingUser.role.code === 'ADMIN' && existingUser.status === 'ACTIVE') {
        const isDeactivating = updateUserDto.status === 'INACTIVE';
        const isChangingRole = updateUserDto.role_id && updateUserDto.role_id !== existingUser.role_id;

        if (isDeactivating || isChangingRole) {
          const activeAdminCount = await this.prisma.user.count({
            where: {
              role: { code: 'ADMIN' },
              status: 'ACTIVE',
            },
          });

          if (activeAdminCount <= 1) {
            throw new BadRequestException(
              'Cannot deactivate or demote the sole active administrator account',
            );
          }
        }
      }

      // If role_id is being updated, check if it exists
      if (updateUserDto.role_id) {
        const role = await this.prisma.role.findUnique({
          where: { id: updateUserDto.role_id },
        });

        if (!role) {
          throw new NotFoundException(
            `Role with ID '${updateUserDto.role_id}' not found`,
          );
        }
      }

      // If email is being updated, check for uniqueness
      if (updateUserDto.email) {
        const existingEmail = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });

        if (existingEmail && existingEmail.id !== id) {
          throw new ConflictException(
            `User with email '${updateUserDto.email}' already exists`,
          );
        }
      }

      // If keycloak_id is being updated, check for uniqueness
      if (updateUserDto.keycloak_id) {
        const existingKeycloakId = await this.prisma.user.findUnique({
          where: { keycloak_id: updateUserDto.keycloak_id },
        });

        if (existingKeycloakId && existingKeycloakId.id !== id) {
          throw new ConflictException(
            `User with keycloak_id '${updateUserDto.keycloak_id}' already exists`,
          );
        }
      }

      // Hash password if being updated
      const updateData: any = { ...updateUserDto };
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          role_id: true,
          keycloak_id: true,
          full_name: true,
          email: true,
          phone: true,
          avatar_url: true,
          status: true,
          created_at: true,
          updated_at: true,
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      return user as ResponseUserDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    try {
      // Prevent deleting own account
      if (currentUserId && id === currentUserId) {
        throw new BadRequestException(
          'You cannot delete your own active administrator account',
        );
      }

      // Check if user exists
      const existingUser = await this.findOne(id);

      // Prevent deleting sole active administrator
      if (existingUser.role.code === 'ADMIN' && existingUser.status === 'ACTIVE') {
        const activeAdminCount = await this.prisma.user.count({
          where: {
            role: { code: 'ADMIN' },
            status: 'ACTIVE',
          },
        });

        if (activeAdminCount <= 1) {
          throw new BadRequestException(
            'Cannot delete the sole active administrator account',
          );
        }
      }

      // Check if user is referenced in RoomRequest as applicant
      const applicantCount = await this.prisma.roomRequest.count({
        where: { applicant_id: id },
      });

      if (applicantCount > 0) {
        throw new ConflictException(
          `Cannot delete user. User is referenced in ${applicantCount} room request(s) as applicant`,
        );
      }

      // Check if user is referenced in RoomRequest as approver
      const approverCount = await this.prisma.roomRequest.count({
        where: { approved_by: id },
      });

      if (approverCount > 0) {
        throw new ConflictException(
          `Cannot delete user. User is referenced in ${approverCount} room request(s) as approver`,
        );
      }

      // Check if user is referenced in RoomUsage as checkedInBy
      const checkedInCount = await this.prisma.roomUsage.count({
        where: { checked_in_by: id },
      });

      if (checkedInCount > 0) {
        throw new ConflictException(
          `Cannot delete user. User is referenced in ${checkedInCount} room usage(s) as checked in by`,
        );
      }

      // Check if user is referenced in RoomUsage as checkedOutBy
      const checkedOutCount = await this.prisma.roomUsage.count({
        where: { checked_out_by: id },
      });

      if (checkedOutCount > 0) {
        throw new ConflictException(
          `Cannot delete user. User is referenced in ${checkedOutCount} room usage(s) as checked out by`,
        );
      }

      // Check if user is referenced in LaboratoryStatusHistory
      const statusHistoryCount =
        await this.prisma.laboratoryStatusHistory.count({
          where: { updated_by: id },
        });

      if (statusHistoryCount > 0) {
        throw new ConflictException(
          `Cannot delete user. User is referenced in ${statusHistoryCount} laboratory status history record(s)`,
        );
      }

      if (existingUser.avatar_url) {
        this.removeAvatarFile(existingUser.avatar_url);
      }

      await this.prisma.user.delete({
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
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  /**
   * Helper to safely remove an avatar file from the local filesystem
   */
  private removeAvatarFile(avatarUrl?: string | null): void {
    if (!avatarUrl) return;
    try {
      const normalized = avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl;
      if (normalized.startsWith('uploads/')) {
        const fullPath = join(process.cwd(), 'public', normalized);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (err) {
      console.warn('Failed to remove old avatar file:', err);
    }
  }

  /**
   * Upload and save a user profile photo
   */
  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatar_url: string; user: ResponseUserDto }> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatar_url: true },
    });

    if (!existingUser) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Delete old avatar file if present
    this.removeAvatarFile(existingUser.avatar_url);

    const relativeUrl = `/uploads/avatars/${file.filename}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar_url: relativeUrl },
      select: {
        id: true,
        role_id: true,
        keycloak_id: true,
        full_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        status: true,
        created_at: true,
        updated_at: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return {
      avatar_url: relativeUrl,
      user: updatedUser as ResponseUserDto,
    };
  }

  /**
   * Delete a user profile photo
   */
  async deleteProfilePhoto(
    userId: string,
  ): Promise<{ message: string; user: ResponseUserDto }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatar_url: true },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    if (existingUser.avatar_url) {
      this.removeAvatarFile(existingUser.avatar_url);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar_url: null },
      select: {
        id: true,
        role_id: true,
        keycloak_id: true,
        full_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        status: true,
        created_at: true,
        updated_at: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return {
      message: 'Profile photo deleted successfully',
      user: updatedUser as ResponseUserDto,
    };
  }

  /**
   * Mengambil daftar tiket permohonan reset kata sandi (Khusus Admin)
   */
  async getResetRequests(status?: 'PENDING' | 'RESOLVED' | 'REJECTED') {
    const where: Prisma.PasswordResetRequestWhereInput = {};
    if (status) {
      where.status = status;
    }

    const requests = await this.prisma.passwordResetRequest.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            status: true,
            avatar_url: true,
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        resolved_by: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    const pendingCount = await this.prisma.passwordResetRequest.count({
      where: { status: 'PENDING' },
    });

    return {
      requests,
      pendingCount,
    };
  }

  /**
   * Memproses tiket permohonan reset kata sandi (APPROVE / REJECT) oleh Admin
   */
  async resolveResetRequest(
    requestId: string,
    adminId: string,
    dto: ResolveResetRequestDto,
  ) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Tiket permohonan reset kata sandi tidak ditemukan');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Permohonan ini sudah diproses sebelumnya dengan status: ${request.status}`,
      );
    }

    if (dto.action === ResolveAction.REJECT) {
      const updated = await this.prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          resolved_by_id: adminId,
          resolved_at: new Date(),
        },
        include: {
          user: true,
          resolved_by: true,
        },
      });

      return {
        message: 'Permohonan reset kata sandi berhasil ditolak.',
        request: updated,
      };
    }

    // Action APPROVE
    const tempPassword =
      dto.temp_password ||
      `UPNVJ#Lab${Math.floor(1000 + Math.random() * 9000)}`;

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user password
    await this.prisma.user.update({
      where: { id: request.user_id },
      data: { password: hashedPassword },
    });

    // Update request
    const updated = await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: 'RESOLVED',
        resolved_by_id: adminId,
        temp_password: tempPassword,
        resolved_at: new Date(),
      },
      include: {
        user: true,
        resolved_by: true,
      },
    });

    // Send notification to user
    await this.prisma.notification.create({
      data: {
        user_id: request.user_id,
        title: 'Kata Sandi Akun Telah Direset',
        message:
          'Kata sandi Anda telah direset oleh Administrator. Silakan hubungi TU Lab FIK UPNVJ untuk menerima kata sandi sementara Anda.',
        category: 'system',
        link_url: '/login',
      },
    });

    return {
      message: 'Kata sandi berhasil direset dan permohonan disetujui.',
      tempPassword,
      request: updated,
    };
  }

  /**
   * Reset kata sandi pengguna langsung oleh Admin (tanpa permohonan tiket)
   */
  async directResetPassword(
    userId: string,
    adminId: string,
    dto: DirectResetPasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    const tempPassword =
      dto.new_password ||
      `UPNVJ#Lab${Math.floor(1000 + Math.random() * 9000)}`;

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Send notification to user
    await this.prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Kata Sandi Telah Diperbarui oleh Administrator',
        message: `Administrator telah mengatur ulang kata sandi akun Anda pada ${new Date().toLocaleString('id-ID')}.`,
        category: 'system',
        link_url: '/login',
      },
    });

    return {
      message: `Kata sandi akun ${user.full_name} berhasil direset.`,
      tempPassword,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role.name,
      },
    };
  }
}
