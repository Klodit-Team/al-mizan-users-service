import { RabbitMqService, RabbitMqEventHandler } from '../rabbitmq/rabbitmq.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { OrganisationsService } from '../organisations/organisations.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ServicesContractantsService } from '../services-contractants/services-contractants.service';
import { OperateursEconomiquesService } from '../operateurs-economiques/operateurs-economiques.service';
import { UserRolesService } from '../user-roles/user-roles.service';
import { Language, RoleName } from '@prisma/client';
import { LanguageEnum } from 'src/common/enums/language.enum';
import {
  OrganisationDocumentDto,
  OrganisationDocumentType,
} from '../organisations/dto/organisation-document.dto';

function normalizeRoleName(role: unknown): RoleName | null {
  if (typeof role !== 'string') {
    return null;
  }

  const normalized = role
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  if (
    normalized === RoleName.SERVICE_CONTRACTANT ||
    normalized === 'CONTRACTANT' ||
    normalized === 'SERVICECONTRACTANT'
  ) {
    return RoleName.SERVICE_CONTRACTANT;
  }

  if (
    normalized === RoleName.OPERATEUR_ECONOMIQUE ||
    normalized === 'OPERATEUR' ||
    normalized === 'OPERATEURECONOMIQUE' ||
    (normalized.includes('OPERATEUR') && normalized.includes('ECONOM'))
  ) {
    return RoleName.OPERATEUR_ECONOMIQUE;
  }

  if (normalized === RoleName.ADMIN) {
    return RoleName.ADMIN;
  }

  if (normalized === RoleName.MEMBRE_COMMISSION) {
    return RoleName.MEMBRE_COMMISSION;
  }

  if (normalized === RoleName.CONTROLEUR) {
    return RoleName.CONTROLEUR;
  }

  return null;
}

export interface UserRegisteredEvent {
  event_id: string;
  user_id: string;
  email: string;
  role: string;
  langue?: string;
  timestamp: string;
  // Profil
  nom: string;
  prenom: string;
  telephone?: string;
  // Organisation
  denomination: string;
  nif?: string;
  nis?: string;
  registre_commerce?: string;
  adresse?: string;
  wilaya?: string;
  commune?: string;
  type: string;
  // SERVICE_CONTRACTANT
  code_service?: string;
  secteur_activite?: string;
  ordonnateur?: string;
  // OPERATEUR_ECONOMIQUE
  qualifications?: string;
  categories?: string;
  documents?: OrganisationDocumentDto[];
  nif_document_base64?: string;
  nif_document_file_name?: string;
  nif_document_mime_type?: string;
  nis_document_base64?: string;
  nis_document_file_name?: string;
  nis_document_mime_type?: string;
  denomination_document_base64?: string;
  denomination_document_file_name?: string;
  denomination_document_mime_type?: string;
}

interface DocumentationOrganisationDocumentsUploadedEvent {
  event_id?: string;
  correlation_id?: string;
  organisation_id: string;
  user_id?: string;
  status?: 'success' | 'failed';
  uploaded_documents?: Array<{
    type: string;
    document_id?: string;
    storage_key?: string;
    file_name?: string;
    url?: string;
    status?: string;
  }>;
  failed_documents?: Array<{
    type: string;
    file_name?: string;
    reason?: string;
  }>;
  error?: string;
  processed_at?: string;
}

class UserRegisteredHandler implements RabbitMqEventHandler {
  constructor(
    private readonly logger: Logger,
    private readonly rabbitmq: RabbitMqService,
    private readonly organisationsService: OrganisationsService,
    private readonly profilesService: ProfilesService,
    private readonly serviceContractantsService: ServicesContractantsService,
    private readonly operateursEconomiquesService: OperateursEconomiquesService,
    private readonly userRolesService: UserRolesService,
  ) {}

  async handle(message: unknown): Promise<void> {
    const event = message as UserRegisteredEvent;
    const canonicalRole = normalizeRoleName(event.role);

    if (!canonicalRole) {
      throw new Error(`Unsupported role in user.registered event: ${String(event.role)}`);
    }

    this.logger.log(`[USER.REGISTERED] event_id=${event.event_id}`);
    this.logger.log(`  user_id      : ${event.user_id}`);
    this.logger.log(`  email        : ${event.email}`);
    this.logger.log(`  role         : ${canonicalRole}`);
    this.logger.log(`  nom          : ${event.nom} ${event.prenom}`);
    this.logger.log(`  denomination : ${event.denomination}`);
    this.logger.log(`  wilaya       : ${event.wilaya} / ${event.commune}`);
    this.logger.log(`  timestamp    : ${event.timestamp}`);

    try {
      let profileId: string | undefined;
      let serviceContractantId: string | undefined;
      let operateurEconomiqueId: string | undefined;

      // 1. Créer l'organisation
      const organisation = await this.organisationsService.create({
        userId: event.user_id,
        eventId: event.event_id,
        denomination: event.denomination,
        nif: event.nif,
        nis: event.nis,
        registreCommerce: event.registre_commerce,
        adresse: event.adresse,
        wilaya: event.wilaya,
        commune: event.commune,
        type: event.type as any,
        email: event.email,
        documents: this.extractOrganisationDocuments(event),
      });
      this.logger.log(`  ✓ organisation créée : ${organisation.id}`);

      // 2. Créer le profil
      try {
        const profile = await this.profilesService.create({
          userId: event.user_id,
          nom: event.nom,
          prenom: event.prenom,
          telephone: event.telephone,
          langue: (event.langue as LanguageEnum) ?? Language.fr,
        });
        profileId = profile.id;
        this.logger.log(`  ✓ profil créé`);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('already exists')) {
          const existingProfile = await this.profilesService.getByUserId(event.user_id);
          profileId = existingProfile.id;
          this.logger.warn(`  ⚠ profil déjà existant pour user_id=${event.user_id}, on continue`);
        } else {
          throw error;
        }
      }

      // 3. Record spécifique au rôle
      if (canonicalRole === RoleName.SERVICE_CONTRACTANT) {
        const serviceContractant = await this.serviceContractantsService.create({
          organisationId: organisation.id,
          userId: event.user_id,
          codeService: event.code_service!,
          secteurActivite: event.secteur_activite,
          ordonateur: event.ordonnateur,
        });
        serviceContractantId = serviceContractant.id;
        this.logger.log(`  ✓ service_contractant créé`);
      } else if (canonicalRole === RoleName.OPERATEUR_ECONOMIQUE) {
        const operateurEconomique = await this.operateursEconomiquesService.create({
          organisationId: organisation.id,
          userId: event.user_id,
          qualifications: event.qualifications,
          categories: event.categories,
          isEligible: true,
        });
        operateurEconomiqueId = operateurEconomique.id;
        this.logger.log(`  ✓ operateur_economique créé`);
      }

      // 4. Assigner le rôle
      try {
        await this.userRolesService.assignByRoleName(
          event.user_id,
          canonicalRole,
        );
        this.logger.log(`  ✓ role assigné : ${canonicalRole}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('already assigned')) {
          this.logger.warn(`  ⚠ role déjà assigné (${canonicalRole}) pour user_id=${event.user_id}, on continue`);
        } else {
          throw error;
        }
      }

      this.logger.log(`[USER.REGISTERED] ✓ traité avec succès → user_id=${event.user_id}`);

      const successPayload = {
        event_id: event.event_id,
        correlation_id: event.event_id,
        user_id: event.user_id,
        email: event.email,
        role: canonicalRole,
        status: 'success',
        organisation_id: organisation.id,
        profile_id: profileId,
        service_contractant_id: serviceContractantId,
        operateur_economique_id: operateurEconomiqueId,
        processed_at: new Date().toISOString(),
      };

      await this.rabbitmq.publish('user.registered.response', successPayload);
    } catch (error) {
      this.logger.error(`[USER.REGISTERED] ✗ échec → user_id=${event.user_id}`, error);

      const reason = error instanceof Error ? error.message : 'Unknown error';
      const failedPayload = {
        event_id: event.event_id,
        correlation_id: event.event_id,
        user_id: event.user_id,
        email: event.email,
        role: event.role,
        status: 'failed',
        reason,
        processed_at: new Date().toISOString(),
      };

      await this.rabbitmq.publish('user.registered.failed', failedPayload);
      await this.rabbitmq.publish('user.registered.response', failedPayload);

      // Ne pas relancer ici: on veut ACK le message RabbitMQ pour éviter une redelivery infinie.
      // La réponse d'échec est déjà publiée via `user.registered.failed`.
      this.logger.warn(
        `[USER.REGISTERED] échec métier notifié, message ACK pour éviter retry infini → user_id=${event.user_id}`,
      );
      return;
    }
  }

  private extractOrganisationDocuments(event: UserRegisteredEvent): OrganisationDocumentDto[] {
    if (event.documents?.length) {
      return event.documents;
    }

    const documents: OrganisationDocumentDto[] = [];

    if (event.nif_document_base64) {
      documents.push({
        type: OrganisationDocumentType.NIF,
        fileName: event.nif_document_file_name ?? 'nif.pdf',
        mimeType: event.nif_document_mime_type,
        contentBase64: event.nif_document_base64,
      });
    }

    if (event.nis_document_base64) {
      documents.push({
        type: OrganisationDocumentType.NIS,
        fileName: event.nis_document_file_name ?? 'nis.pdf',
        mimeType: event.nis_document_mime_type,
        contentBase64: event.nis_document_base64,
      });
    }

    if (event.denomination_document_base64) {
      documents.push({
        type: OrganisationDocumentType.DENOMINATION,
        fileName: event.denomination_document_file_name ?? 'denomination.pdf',
        mimeType: event.denomination_document_mime_type,
        contentBase64: event.denomination_document_base64,
      });
    }

    return documents;
  }
}

class DocumentationOrganisationDocumentsUploadedHandler implements RabbitMqEventHandler {
  constructor(
    private readonly logger: Logger,
    private readonly rabbitmq: RabbitMqService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  async handle(message: unknown): Promise<void> {
    const event = message as DocumentationOrganisationDocumentsUploadedEvent;
    const status = this.resolveStatus(event);

    const references = this.toReferenceInputs(event);
    if (references.length > 0) {
      await this.organisationsService.upsertDocumentReferences(event.organisation_id, references);
    }

    this.logger.log(
      `[DOCS.UPLOAD] organisation_id=${event.organisation_id} status=${status} correlation=${event.correlation_id ?? event.event_id ?? 'n/a'}`,
    );

    const ackPayload = {
      event_id: event.event_id ?? event.correlation_id,
      correlation_id: event.correlation_id ?? event.event_id,
      organisation_id: event.organisation_id,
      user_id: event.user_id,
      status,
      uploaded_documents: event.uploaded_documents ?? [],
      failed_documents: event.failed_documents ?? [],
      reason: event.error,
      references_processed: references.length,
      processed_at: event.processed_at ?? new Date().toISOString(),
    };

    await this.rabbitmq.publish('user.organisation.documents.upload.response', ackPayload);

    if (status === 'success') {
      await this.rabbitmq.publish('user.organisation.documents.uploaded', ackPayload);
      return;
    }

    await this.rabbitmq.publish('user.organisation.documents.upload.failed', ackPayload);
  }

  private resolveStatus(
    event: DocumentationOrganisationDocumentsUploadedEvent,
  ): 'success' | 'failed' {
    if (event.status === 'success' || event.status === 'failed') {
      return event.status;
    }

    if (event.error || (event.failed_documents?.length ?? 0) > 0) {
      return 'failed';
    }

    return 'success';
  }

  private toReferenceInputs(event: DocumentationOrganisationDocumentsUploadedEvent): Array<{
    type: OrganisationDocumentType;
    documentId: string;
    fileName?: string;
    storageKey?: string;
    url?: string;
    status?: string;
  }> {
    const uploaded = event.uploaded_documents ?? [];
    const references: Array<{
      type: OrganisationDocumentType;
      documentId: string;
      fileName?: string;
      storageKey?: string;
      url?: string;
      status?: string;
    }> = [];

    for (const item of uploaded) {
      const type = this.parseDocumentType(item.type);
      const documentId = item.document_id ?? item.storage_key ?? item.url;

      if (!type || !documentId) {
        continue;
      }

      references.push({
        type,
        documentId,
        fileName: item.file_name,
        storageKey: item.storage_key,
        url: item.url,
        status: item.status ?? event.status ?? 'uploaded',
      });
    }

    return references;
  }

  private parseDocumentType(type: string): OrganisationDocumentType | undefined {
    if (type === OrganisationDocumentType.NIF) {
      return OrganisationDocumentType.NIF;
    }
    if (type === OrganisationDocumentType.NIS) {
      return OrganisationDocumentType.NIS;
    }
    if (type === OrganisationDocumentType.DENOMINATION) {
      return OrganisationDocumentType.DENOMINATION;
    }

    return undefined;
  }
}

@Injectable()
export class AuthEventsListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthEventsListener.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly rabbitmq: RabbitMqService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Initialisation des listeners Auth Events...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Récupérer les services via ModuleRef après le démarrage
      const organisationsService = this.moduleRef.get(OrganisationsService, { strict: false });
      const profilesService = this.moduleRef.get(ProfilesService, { strict: false });
      const serviceContractantsService = this.moduleRef.get(ServicesContractantsService, { strict: false });
      const operateursEconomiquesService = this.moduleRef.get(OperateursEconomiquesService, { strict: false });
      const userRolesService = this.moduleRef.get(UserRolesService, { strict: false });

      if (!organisationsService || !profilesService || !serviceContractantsService || 
          !operateursEconomiquesService || !userRolesService) {
        this.logger.warn('⚠️ Services not available - RabbitMQ listeners not initialized');
        return;
      }

      const handler = new UserRegisteredHandler(
        this.logger,
        this.rabbitmq,
        organisationsService,
        profilesService,
        serviceContractantsService,
        operateursEconomiquesService,
        userRolesService,
      );

      await this.rabbitmq.subscribe(
        'user.registered',
        handler,
        'users-service.user.registered',
      );

      const documentationDocumentsUploadedHandler =
        new DocumentationOrganisationDocumentsUploadedHandler(
          this.logger,
          this.rabbitmq,
          organisationsService,
        );

      await this.rabbitmq.subscribe(
        'documentation.organisation.documents.uploaded',
        documentationDocumentsUploadedHandler,
        'users-service.documentation.organisation.documents.uploaded',
      );

      await this.rabbitmq.subscribe(
        'documentation.organisation.documents.failed',
        documentationDocumentsUploadedHandler,
        'users-service.documentation.organisation.documents.failed',
      );

      this.logger.log('✓ Auth Events Listeners initialisés');
    } catch (error) {
      this.logger.error('✗ Échec initialisation Auth Events Listeners', error);
    }
  }
}