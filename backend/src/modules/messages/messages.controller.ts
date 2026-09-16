import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { QueryMessageDto } from './dto/query-message.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get messages for current user by folder' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully' })
  async findAll(
    @CurrentUser() user: any,
    @Query() query: QueryMessageDto,
  ) {
    return this.messagesService.findAll(user.userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count for current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unread count retrieved' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single message by ID and mark as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message retrieved' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.findOne(id, user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Message sent successfully' })
  async create(
    @CurrentUser() user: any,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.create(user.userId, createMessageDto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message archived' })
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.archive(id, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.remove(id, user.userId);
  }
}
