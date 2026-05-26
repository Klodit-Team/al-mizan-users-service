import { Test, TestingModule } from '@nestjs/testing';
import { ServicesContractantsService } from './services-contractants.service';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ServicesContractantsService', () => {
  let service: ServicesContractantsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organisation: {
      findUnique: jest.fn(),
    },
    serviceContractant: {
      create: jest.fn(),
    },
  };

  const mockRabbitMqService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesContractantsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RabbitMqService, useValue: mockRabbitMqService },
      ],
    }).compile();

    service = module.get<ServicesContractantsService>(ServicesContractantsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Block ENTREPRISE_PRIVEE', () => {
    it('should throw BadRequestException if organization type is ENTREPRISE_PRIVEE', async () => {
      // Mock findUnique to return an organization of type ENTREPRISE_PRIVEE
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-123',
        type: 'ENTREPRISE_PRIVEE',
        denomination: 'Private Company',
      });

      const dto = {
        organisationId: 'org-123',
        userId: 'user-456',
        codeService: 'SC-01',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Un service contractant ne peut pas être lié à une organisation de type ENTREPRISE_PRIVEE.',
      );
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue(null);

      const dto = {
        organisationId: 'org-nonexistent',
        userId: 'user-456',
        codeService: 'SC-01',
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should allow creation if organization is not ENTREPRISE_PRIVEE', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'org-123',
        type: 'EPA',
        denomination: 'Public EPA',
      });

      mockPrismaService.serviceContractant.create.mockResolvedValue({
        id: 'sc-789',
        organisationId: 'org-123',
        userId: 'user-456',
        codeService: 'SC-01',
      });

      const dto = {
        organisationId: 'org-123',
        userId: 'user-456',
        codeService: 'SC-01',
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.id).toBe('sc-789');
      expect(mockPrismaService.serviceContractant.create).toHaveBeenCalled();
    });
  });
});
