import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { QueryMessageDto } from './dto/query-message.dto.js';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(userId: string, query: QueryMessageDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const folder = (query.folder || 'inbox').toLowerCase();
    const search = query.search?.trim();
    const skip = (page - 1) * limit;

    const where: any = {};

    if (folder === 'sent') {
      where.sender_id = userId;
    } else if (folder === 'archived') {
      where.folder = 'archived';
      where.OR = [
        { recipient_id: userId },
        { sender_id: userId },
      ];
    } else {
      // Inbox
      where.folder = 'inbox';
      where.OR = [
        { recipient_id: userId },
        { recipient_id: null },
      ];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { subject: { contains: search, mode: 'insensitive' } },
            { body: { contains: search, mode: 'insensitive' } },
            { sender: { full_name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          recipient: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is either sender or recipient
    if (message.sender_id !== userId && message.recipient_id !== userId && message.recipient_id !== null) {
      throw new ForbiddenException('You do not have permission to view this message');
    }

    // If viewing received message as recipient, automatically mark as read
    if (message.recipient_id === userId && !message.is_read) {
      await this.prisma.message.update({
        where: { id },
        data: { is_read: true },
      });
      message.is_read = true;
    }

    return message;
  }

  async create(senderId: string, dto: CreateMessageDto) {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { full_name: true },
    });

    const message = await this.prisma.message.create({
      data: {
        sender_id: senderId,
        recipient_id: dto.recipient_id || null,
        subject: dto.subject,
        body: dto.body,
        attachment_url: dto.attachment_url,
        folder: 'inbox',
        is_read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: { select: { id: true, name: true, code: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    // Notify recipient if specified
    if (dto.recipient_id) {
      await this.notificationsService.create({
        user_id: dto.recipient_id,
        title: `New message: ${dto.subject}`,
        message: `${sender?.full_name || 'A user'} sent you a message: "${dto.body.substring(0, 80)}..."`,
        category: 'system',
        link_url: `/admin/messages?id=${message.id}`,
      });
    }

    return message;
  }

  async archive(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender_id !== userId && message.recipient_id !== userId) {
      throw new ForbiddenException('You do not have permission to archive this message');
    }

    return this.prisma.message.update({
      where: { id },
      data: { folder: 'archived' },
    });
  }

  async remove(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender_id !== userId && message.recipient_id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    return this.prisma.message.delete({
      where: { id },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        folder: 'inbox',
        is_read: false,
        OR: [
          { recipient_id: userId },
          { recipient_id: null },
        ],
      },
    });

    return { count };
  }
}
