import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { full_name, email, password, phone, role_code } = registerDto;

    // Strict Admin Guard: Disallow registering as ADMIN
    if ((role_code as string).toUpperCase() === 'ADMIN') {
      throw new BadRequestException('Administrator registration is restricted to system setup.');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('Email address is already registered.');
    }

    // Find target role in database
    const role = await this.prisma.role.findUnique({
      where: { code: role_code.toUpperCase() },
    });

    if (!role) {
      throw new BadRequestException(`Role '${role_code}' does not exist in the system.`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new active user
    const newUser = await this.prisma.user.create({
      data: {
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim() || null,
        role_id: role.id,
        status: 'ACTIVE',
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

    // Generate JWT token for immediate login
    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role.code,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        avatar_url: newUser.avatar_url ?? null,
        status: newUser.status,
        role: {
          code: newUser.role.code,
          name: newUser.role.name,
        },
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user with role
    const user = await this.prisma.user.findUnique({
      where: { email },
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

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.code,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return auth response (never include password)
    return {
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url ?? null,
        status: user.status,
        role: {
          code: user.role.code,
          name: user.role.name,
        },
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
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
            description: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async forgotPasswordRequest(dto: ForgotPasswordRequestDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new BadRequestException('Alamat email tidak terdaftar dalam sistem LabDisplay.');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Akun berstatus nonaktif. Silakan hubungi Administrator TU Lab.');
    }

    // Check if there is already a PENDING request
    const existingPending = await this.prisma.passwordResetRequest.findFirst({
      where: {
        user_id: user.id,
        status: 'PENDING',
      },
      orderBy: { created_at: 'desc' },
    });

    if (existingPending) {
      return {
        message: 'Permohonan reset kata sandi Anda sebelumnya masih dalam antrean peninjauan Administrator TU.',
        requestId: existingPending.id,
        status: existingPending.status,
        created_at: existingPending.created_at,
        isExisting: true,
      };
    }

    // Create new PasswordResetRequest
    const request = await this.prisma.passwordResetRequest.create({
      data: {
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        role_code: user.role.code,
        notes: dto.notes?.trim() || null,
        status: 'PENDING',
      },
    });

    // Notify all active Administrators
    const admins = await this.prisma.user.findMany({
      where: {
        role: { code: 'ADMIN' },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          user_id: admin.id,
          title: 'Permohonan Reset Kata Sandi Baru',
          message: `${user.full_name} (${user.role.name} - ${user.email}) telah mengajukan permohonan reset kata sandi.`,
          category: 'system',
          link_url: '/admin/users',
        })),
      });
    }

    return {
      message: 'Permohonan reset kata sandi berhasil diajukan ke Administrator Laboratorium & TU FIK UPNVJ.',
      requestId: request.id,
      status: request.status,
      created_at: request.created_at,
      isExisting: false,
    };
  }
}

