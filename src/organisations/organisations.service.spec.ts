import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationsService } from './organisations.service';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { BadRequestException } from '@nestjs/common';

describe('OrganisationsService - dossier completeness validation', () => {
  let service: OrganisationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organisation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockRabbitMqService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RabbitMqService, useValue: mockRabbitMqService },
      ],
    }).compile();

    service = module.get<OrganisationsService>(OrganisationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verify', () => {
    it('Test 2: should allow public organizations (EPA, EPIC, MINISTERE) to be verified even without NIF/NIS/RC or documents', async () => {
      // Mock EPA organisation having no NIF/NIS/RC text fields and no documents
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'epa-123',
        type: 'EPA',
        denomination: 'Public EPA Org',
        nif: null,
        nis: null,
        registreCommerce: null,
        documentReferences: [], // No documents uploaded
      });

      mockPrismaService.organisation.update.mockResolvedValue({
        id: 'epa-123',
        type: 'EPA',
        denomination: 'Public EPA Org',
        isVerified: true,
      });

      const result = await service.verify('epa-123');
      expect(result).toBeDefined();
      expect(result.isVerified).toBe(true);
      expect(mockPrismaService.organisation.update).toHaveBeenCalledWith({
        where: { id: 'epa-123' },
        data: { isVerified: true },
      });
    });

    it('Test 3: should throw BadRequestException when trying to verify an ENTREPRISE_PRIVEE without required text fields or documents', async () => {
      // Mock ENTREPRISE_PRIVEE having missing text fields and documents
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'privee-123',
        type: 'ENTREPRISE_PRIVEE',
        denomination: 'Private Co',
        nif: null, // missing
        nis: 'some-nis',
        registreCommerce: 'some-rc',
        documentReferences: [],
      });

      await expect(service.verify('privee-123')).rejects.toThrow(BadRequestException);
      await expect(service.verify('privee-123')).rejects.toThrow(
        "Le dossier est incomplet : NIF, NIS et Registre du Commerce sont obligatoires pour ce type d'organisation.",
      );
    });

    it('Test 3: should throw BadRequestException when trying to verify an ENTREPRISE_PRIVEE with text fields but missing uploaded documents', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'privee-456',
        type: 'ENTREPRISE_PRIVEE',
        denomination: 'Private Co 2',
        nif: 'some-nif',
        nis: 'some-nis',
        registreCommerce: 'some-rc',
        documentReferences: [
          { type: 'NIF' }, // missing NIS and DENOMINATION documents
        ],
      });

      await expect(service.verify('privee-456')).rejects.toThrow(BadRequestException);
      await expect(service.verify('privee-456')).rejects.toThrow(
        "Le dossier est incomplet : Les documents justificatifs (NIF, NIS, Dénomination/RC) doivent être téléversés.",
      );
    });

    it('should succeed to verify an ENTREPRISE_PRIVEE if it has all text fields and uploaded documents', async () => {
      mockPrismaService.organisation.findUnique.mockResolvedValue({
        id: 'privee-complete',
        type: 'ENTREPRISE_PRIVEE',
        denomination: 'Complete Private Co',
        nif: 'some-nif',
        nis: 'some-nis',
        registreCommerce: 'some-rc',
        documentReferences: [
          { type: 'NIF' },
          { type: 'NIS' },
          { type: 'DENOMINATION' },
        ],
      });

      mockPrismaService.organisation.update.mockResolvedValue({
        id: 'privee-complete',
        isVerified: true,
      });

      const result = await service.verify('privee-complete');
      expect(result).toBeDefined();
      expect(result.isVerified).toBe(true);
    });
  });
});
