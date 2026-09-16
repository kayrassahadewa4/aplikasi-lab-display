import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResponseUserDto } from './dto/response-user.dto.js';
import { ResolveResetRequestDto, DirectResetPasswordDto } from './dto/resolve-reset-request.dto.js';
import { UserQueryDto } from './dto/user-query.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: ResponseUserDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or keycloak_id already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users with pagination and search' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by full name or email',
    example: 'john',
  })
  @ApiQuery({
    name: 'role_id',
    required: false,
    type: String,
    description: 'Filter by role ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Filter by user status',
    example: 'ACTIVE',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async findAll(
    @Query() queryDto: UserQueryDto,
  ): Promise<PaginatedResponseDto<ResponseUserDto>> {
    const { page, limit, search, role_id, status } = queryDto;
    return this.userService.findAll(page, limit, search, role_id, status);
  }

  @Post('profile/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Only image files (JPEG, PNG, WEBP) are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload profile photo for current user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, WEBP, max 2MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile photo uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file size exceeds limit (max 2MB)',
  })
  async uploadProfilePhoto(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided or file rejected by validator');
    }
    return this.userService.uploadProfilePhoto(user.userId, file);
  }

  @Delete('profile/photo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete profile photo for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile photo deleted successfully',
  })
  async deleteProfilePhoto(@CurrentUser() user: any) {
    return this.userService.deleteProfilePhoto(user.userId);
  }

  @Get('reset-requests')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all password reset requests (Admin only)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'RESOLVED', 'REJECTED'],
    description: 'Filter by ticket status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset requests retrieved successfully',
  })
  async getResetRequests(@Query('status') status?: 'PENDING' | 'RESOLVED' | 'REJECTED') {
    return this.userService.getResetRequests(status);
  }

  @Patch('reset-requests/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Resolve a password reset request (Approve or Reject)' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Reset Request UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reset request processed successfully',
  })
  async resolveResetRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ResolveResetRequestDto,
  ) {
    return this.userService.resolveResetRequest(id, user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User UUID',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: ResponseUserDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<ResponseUserDto> {
    if (user.role !== 'ADMIN' && user.userId !== id) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk melihat data pengguna lain');
    }
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User UUID',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: ResponseUserDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or Role not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or keycloak_id already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    // Non-admin users can only update their own profile
    if (user.role !== 'ADMIN' && user.userId !== id) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk mengubah data pengguna lain');
    }

    // Non-admin users cannot change role or account status
    if (user.role !== 'ADMIN') {
      if (updateUserDto.role_id !== undefined || updateUserDto.status !== undefined) {
        throw new ForbiddenException('Anda tidak memiliki izin untuk mengubah peran atau status akun');
      }
    }

    return this.userService.update(id, updateUserDto, user?.userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User UUID',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is referenced by other records and cannot be deleted',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.userService.remove(id, user?.userId);
  }

  @Post(':id/direct-reset-password')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Directly reset a user password by Admin' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User password reset successfully',
  })
  async directResetPassword(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: DirectResetPasswordDto,
  ) {
    return this.userService.directResetPassword(id, user.userId, dto);
  }
}
