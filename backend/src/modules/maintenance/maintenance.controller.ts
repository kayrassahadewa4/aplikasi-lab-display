import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { MaintenanceService } from './maintenance.service.js';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto.js';
import { MaintenanceLogQueryDto } from './dto/maintenance-log-query.dto.js';
import { ResponseMaintenanceLogDto } from './dto/response-maintenance-log.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Facility Maintenance Logs')
@Controller('maintenance-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('upload-attachment')
  @Roles('ADMIN', 'LABORAN')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'maintenance');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `maint-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new BadRequestException('Hanya berkas dokumen/gambar (PDF, JPEG, PNG, WEBP) yang diizinkan!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload maintenance report / receipt document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Document or receipt (PDF, PNG, JPG, max 5MB)' },
      },
    },
  })
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; originalname: string; size: number }> {
    if (!file) {
      throw new BadRequestException('Berkas lampiran tidak ditemukan!');
    }
    return {
      url: `/uploads/maintenance/${file.filename}`,
      originalname: file.originalname,
      size: file.size,
    };
  }

  @Post()
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Record a new facility maintenance activity' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ResponseMaintenanceLogDto })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateMaintenanceLogDto,
  ): Promise<ResponseMaintenanceLogDto> {
    return this.maintenanceService.create(user.userId, dto);
  }

  @Get()
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Get all maintenance logs with pagination and filters' })
  async findAll(
    @Query() queryDto: MaintenanceLogQueryDto,
  ): Promise<PaginatedResponseDto<ResponseMaintenanceLogDto>> {
    return this.maintenanceService.findAll(queryDto);
  }

  @Get(':id')
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Get maintenance log details by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ResponseMaintenanceLogDto })
  async findOne(@Param('id') id: string): Promise<ResponseMaintenanceLogDto> {
    return this.maintenanceService.findOne(id);
  }
}
