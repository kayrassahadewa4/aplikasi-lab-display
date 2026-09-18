import {
  Controller,
  Get,
  Post,
  Patch,
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
import { IssueTicketService } from './issue-ticket.service.js';
import { CreateIssueTicketDto } from './dto/create-issue-ticket.dto.js';
import { UpdateIssueTicketStatusDto } from './dto/update-issue-ticket-status.dto.js';
import { IssueTicketQueryDto } from './dto/issue-ticket-query.dto.js';
import { ResponseIssueTicketDto } from './dto/response-issue-ticket.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Facility Issue Tickets')
@Controller('issue-tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IssueTicketController {
  constructor(private readonly issueTicketService: IssueTicketService) {}

  @Post('upload-image')
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'issues');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `issue-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new BadRequestException('Hanya berkas gambar (JPEG, PNG, WEBP) yang diizinkan!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 4 * 1024 * 1024, // 4MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload evidence photo for issue ticket' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Photo file (PNG, JPG, max 4MB)' },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; originalname: string; size: number }> {
    if (!file) {
      throw new BadRequestException('Berkas gambar tidak ditemukan!');
    }
    return {
      url: `/uploads/issues/${file.filename}`,
      originalname: file.originalname,
      size: file.size,
    };
  }

  @Post()
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Create a new laboratory equipment issue ticket' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ResponseIssueTicketDto })
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateIssueTicketDto,
  ): Promise<ResponseIssueTicketDto> {
    return this.issueTicketService.create(user.userId, dto);
  }

  @Get()
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Get all issue tickets with pagination and filters' })
  async findAll(
    @Query() queryDto: IssueTicketQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponseDto<ResponseIssueTicketDto>> {
    return this.issueTicketService.findAll(queryDto, user);
  }

  @Get(':id')
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Get issue ticket details by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ResponseIssueTicketDto })
  async findOne(@Param('id') id: string): Promise<ResponseIssueTicketDto> {
    return this.issueTicketService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Update issue ticket status and resolution notes (Staff/Admin)' })
  @ApiResponse({ status: HttpStatus.OK, type: ResponseIssueTicketDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIssueTicketStatusDto,
    @CurrentUser() user: any,
  ): Promise<ResponseIssueTicketDto> {
    return this.issueTicketService.updateStatus(id, dto, user.userId);
  }
}
