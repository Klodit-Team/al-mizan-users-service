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

    this.logger.log(`[USER.REGISTERED] event_id=${event.event_id}`);
    this.logger.log(`  user_id      : ${event.user_id}`);
    this.logger.log(`  email        : ${event.email}`);
    this.logger.log(`  role         : ${event.role}`);
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
        denomination: event.denomination,
        nif: event.nif,
        nis: event.nis,
        registreCommerce: event.registre_commerce,
        adresse: event.adresse,
        wilaya: event.wilaya,
        commune: event.commune,
        type: event.type as any,
        email: event.email,
       
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
      if (event.role === RoleName.SERVICE_CONTRACTANT) {
        const serviceContractant = await this.serviceContractantsService.create({
          organisationId: organisation.id,
          userId: event.user_id,
          codeService: event.code_service!,
          secteurActivite: event.secteur_activite,
          ordonateur: event.ordonnateur,
        });
        serviceContractantId = serviceContractant.id;
        this.logger.log(`  ✓ service_contractant créé`);
      } else if (event.role === RoleName.OPERATEUR_ECONOMIQUE) {
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
          event.role as RoleName,
        );
        this.logger.log(`  ✓ role assigné : ${event.role}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('already assigned')) {
          this.logger.warn(`  ⚠ role déjà assigné (${event.role}) pour user_id=${event.user_id}, on continue`);
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
        role: event.role,
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

      this.logger.log('✓ Auth Events Listeners initialisés');
    } catch (error) {
      this.logger.error('✗ Échec initialisation Auth Events Listeners', error);
    }
  }
}