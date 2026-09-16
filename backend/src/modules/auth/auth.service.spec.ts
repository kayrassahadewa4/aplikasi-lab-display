import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService - Register & Login', () => {
  let authService: AuthService;
  let prismaService: any;
  let jwtService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should reject registration when role is ADMIN', async () => {
      await expect(
        authService.register({
          full_name: 'Admin Attempter',
          email: 'admin_fake@lab.com',
          password: 'password123',
          role_code: 'ADMIN' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email is already registered', async () => {
      prismaService.user.findUnique.mockResolvedValue({ id: 'existing-user-id' });

      await expect(
        authService.register({
          full_name: 'Dr. Existing',
          email: 'existing@univ.ac.id',
          password: 'password123',
          role_code: 'DOSEN',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if role does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        authService.register({
          full_name: 'Dr. NonExistent',
          email: 'no_role@univ.ac.id',
          password: 'password123',
          role_code: 'DOSEN',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully register a DOSEN and return token & user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.role.findUnique.mockResolvedValue({
        id: 'dosen-role-id',
        code: 'DOSEN',
        name: 'Lecturer',
      });

      const mockCreatedUser = {
        id: 'new-dosen-id',
        full_name: 'Dr. Budi Santoso, M.Kom',
        email: 'budi.santoso@univ.ac.id',
        status: 'ACTIVE',
        role: {
          id: 'dosen-role-id',
          code: 'DOSEN',
          name: 'Lecturer',
        },
      };
      prismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await authService.register({
        full_name: 'Dr. Budi Santoso, M.Kom',
        email: 'budi.santoso@univ.ac.id',
        password: 'password123',
        phone: '+62 812-3456-7890',
        role_code: 'DOSEN',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe('new-dosen-id');
      expect(result.user.role.code).toBe('DOSEN');
      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            full_name: 'Dr. Budi Santoso, M.Kom',
            email: 'budi.santoso@univ.ac.id',
            role_id: 'dosen-role-id',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should successfully register a LABORAN and return token & user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.role.findUnique.mockResolvedValue({
        id: 'laboran-role-id',
        code: 'LABORAN',
        name: 'Laboratory Staff',
      });

      const mockCreatedUser = {
        id: 'new-laboran-id',
        full_name: 'Staff Siti, S.T.',
        email: 'siti@univ.ac.id',
        status: 'ACTIVE',
        role: {
          id: 'laboran-role-id',
          code: 'LABORAN',
          name: 'Laboratory Staff',
        },
      };
      prismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await authService.register({
        full_name: 'Staff Siti, S.T.',
        email: 'siti@univ.ac.id',
        password: 'password123',
        role_code: 'LABORAN',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe('new-laboran-id');
      expect(result.user.role.code).toBe('LABORAN');
    });
  });
});
