import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { RoomRequestController } from './room-request.controller';
import { RoomRequestService } from './room-request.service';
import { RequestStatus } from '@prisma/client';

describe('RoomRequestController - Role DOSEN (Lecturer)', () => {
  let controller: RoomRequestController;
  let service: any;

  const mockDosenUser = {
    userId: 'dosen-uuid-1',
    email: 'lecturer@lab.com',
    role: 'DOSEN',
  };

  const mockOtherDosenUser = {
    userId: 'dosen-uuid-2',
    email: 'other_lecturer@lab.com',
    role: 'DOSEN',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'req-1', ...dto })),
      findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } }),
      findOne: jest.fn(),
      update: jest.fn().mockImplementation((id, dto) => Promise.resolve({ id, ...dto })),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomRequestController],
      providers: [{ provide: RoomRequestService, useValue: service }],
    }).compile();

    controller = module.get<RoomRequestController>(RoomRequestController);
  });

  describe('create (Lecturer booking submission)', () => {
    it('should force applicant_id to current lecturer and status to PENDING', async () => {
      const dto: any = {
        laboratory_id: 'lab-1',
        activity_name: 'Praktikum Jaringan Komputer',
        request_date: '2026-11-20',
        start_time: '08:00:00',
        end_time: '10:00:00',
        participant_count: 35,
      };

      await controller.create(mockDosenUser, dto);

      expect(dto.applicant_id).toBe('dosen-uuid-1');
      expect(dto.status).toBe(RequestStatus.PENDING);
      expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
        applicant_id: 'dosen-uuid-1',
        status: RequestStatus.PENDING,
      }));
    });
  });

  describe('findAll (Lecturer request scoping)', () => {
    it('should strictly filter requests by current lecturer ID', async () => {
      const query: any = { page: 1, limit: 10, applicant_id: 'arbitrary-id' };

      await controller.findAll(mockDosenUser, query);

      expect(service.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        undefined,
        'dosen-uuid-1', // Overridden to current lecturer ID
        undefined,
      );
    });
  });

  describe('findOne (Lecturer ownership check)', () => {
    it('should allow lecturer to view their own room request', async () => {
      service.findOne.mockResolvedValue({
        id: 'req-1',
        applicant_id: 'dosen-uuid-1',
        activity_name: 'Praktikum Basis Data',
      });

      const result = await controller.findOne(mockDosenUser, 'req-1');
      expect(result.id).toBe('req-1');
    });

    it('should throw ForbiddenException when lecturer accesses another user request', async () => {
      service.findOne.mockResolvedValue({
        id: 'req-2',
        applicant_id: 'other-user-uuid',
        activity_name: 'Private Booking',
      });

      await expect(controller.findOne(mockDosenUser, 'req-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update (Lecturer modify restrictions)', () => {
    it('should throw ForbiddenException if lecturer attempts to approve or reject', async () => {
      service.findOne.mockResolvedValue({
        id: 'req-1',
        applicant_id: 'dosen-uuid-1',
        status: RequestStatus.PENDING,
      });

      await expect(
        controller.update(mockDosenUser, 'req-1', {
          status: RequestStatus.APPROVED,
        } as any),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        controller.update(mockDosenUser, 'req-1', {
          status: RequestStatus.REJECTED,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if modifying someone else request', async () => {
      service.findOne.mockResolvedValue({
        id: 'req-1',
        applicant_id: 'other-uuid',
        status: RequestStatus.PENDING,
      });

      await expect(
        controller.update(mockDosenUser, 'req-1', {
          activity_name: 'Malicious Change',
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow cancelling own PENDING request', async () => {
      service.findOne.mockResolvedValue({
        id: 'req-1',
        applicant_id: 'dosen-uuid-1',
        status: RequestStatus.PENDING,
      });

      await controller.update(mockDosenUser, 'req-1', {
        status: RequestStatus.CANCELLED,
      } as any);

      expect(service.update).toHaveBeenCalledWith('req-1', expect.objectContaining({
        status: RequestStatus.CANCELLED,
      }));
    });
  });

  describe('remove (Lecturer delete permissions)', () => {
    it('should allow deleting own PENDING request', async () => {
      service.findOne.mockResolvedValue({
        id: 'req-1',
        applicant_id: 'dosen-uuid-1',
        status: RequestStatus.PENDING,
      });

      await controller.remove(mockDosenUser, 'req-1');
      expect(service.remove).toHaveBeenCalledWith('req-1');
    });

    it('should throw BadRequestException if deleting an APPROVED request', async () => {
      service.findOne.mockResolvedValue({
        id: 'req-1',
        applicant_id: 'dosen-uuid-1',
        status: RequestStatus.APPROVED,
      });

      await expect(controller.remove(mockDosenUser, 'req-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if deleting someone else request', async () => {
      service.findOne.mockResolvedValue({
        id: 'req-1',
        applicant_id: 'someone-else',
        status: RequestStatus.PENDING,
      });

      await expect(controller.remove(mockDosenUser, 'req-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
