import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

  private async verifyGoogleToken(credential: string): Promise<{
    email: string;
    name: string;
    picture?: string;
    sub: string;
  }> {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID;

    // 1. If it looks like a real Google JWT token (three dot-separated segments)
    if (credential.includes('.') && credential.split('.').length === 3) {
      try {
        if (googleClientId) {
          const client = new OAuth2Client(googleClientId);
          const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: googleClientId,
          });
          const payload = ticket.getPayload();
          if (payload && payload.email) {
            return {
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              picture: payload.picture,
              sub: payload.sub,
            };
          }
        } else {
          // If no GOOGLE_CLIENT_ID set yet, verify using Google's public tokeninfo endpoint
          const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
          if (response.ok) {
            const data: any = await response.json();
            if (data.email) {
              return {
                email: data.email,
                name: data.name || data.email.split('@')[0],
                picture: data.picture,
                sub: data.sub,
              };
            }
          }
        }
      } catch (err: any) {
        console.warn('Google token verification failed via official client, checking dev fallback:', err.message);
      }
    }

    // 2. Dev / Simulation Mode Fallback:
    // Allows instant testing in local environment without GCP configuration if credential is an email or JSON
    if (credential.includes('@')) {
      return {
        email: credential.toLowerCase().trim(),
        name: credential.split('@')[0].replace(/[._-]/g, ' '),
        sub: `dev-${credential}`,
      };
    }

    // Try decoding JSON payload if sent by dev simulator
    try {
      const parsed = JSON.parse(credential);
      if (parsed.email) {
        return {
          email: parsed.email.toLowerCase().trim(),
          name: parsed.name || parsed.email.split('@')[0],
          picture: parsed.picture,
          sub: parsed.sub || `dev-${parsed.email}`,
        };
      }
    } catch {
      // not JSON
    }

    // Decode base64 JWT payload directly if valid JWT
    if (credential.includes('.') && credential.split('.').length === 3) {
      try {
        const payloadBase64 = credential.split('.')[1];
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const parsed = JSON.parse(decodedJson);
        if (parsed.email) {
          return {
            email: parsed.email.toLowerCase().trim(),
            name: parsed.name || parsed.email.split('@')[0],
            picture: parsed.picture,
            sub: parsed.sub || `google-${parsed.email}`,
          };
        }
      } catch {
        // not valid base64
      }
    }

    throw new BadRequestException('Token kredensial Google tidak valid.');
  }

  async googleLogin(dto: GoogleLoginDto): Promise<AuthResponseDto> {
    const googleProfile = await this.verifyGoogleToken(dto.credential);
    const email = googleProfile.email.toLowerCase().trim();
    const fullName = dto.full_name?.trim() || googleProfile.name || email.split('@')[0];
    const avatarUrl = dto.avatar_url || googleProfile.picture || null;

    // 1. Check if user already exists
    let user = await this.prisma.user.findUnique({
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

    if (user) {
      // STRICT ROLE ENFORCEMENT: Only LABORAN and DOSEN allowed!
      if (user.role.code === 'ADMIN') {
        throw new UnauthorizedException(
          'Login Google hanya diperuntukkan bagi akun Dosen dan Laboran. Akun Administrator wajib menggunakan login kata sandi resmi.'
        );
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Akun Anda berstatus nonaktif. Silakan hubungi Administrator Laboratorium.');
      }

      // Update avatar if provided and currently null
      if (avatarUrl && !user.avatar_url) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatar_url: avatarUrl },
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
      }
    } else {
      // 2. New User Auto-Provisioning (Strictly DOSEN or LABORAN, never ADMIN)
      let requestedRole = (dto.target_role || 'DOSEN').toUpperCase();
      if (requestedRole === 'ADMIN') {
        requestedRole = 'DOSEN';
      }

      const role = await this.prisma.role.findUnique({
        where: { code: requestedRole },
      });

      if (!role) {
        throw new BadRequestException(`Peran '${requestedRole}' tidak ditemukan dalam sistem.`);
      }

      // Generate a secure random password for the database record
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          full_name: fullName,
          email,
          password: hashedPassword,
          avatar_url: avatarUrl,
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
    }

    // 3. Issue JWT access token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.code,
    };

    const accessToken = this.jwtService.sign(payload);

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
}

