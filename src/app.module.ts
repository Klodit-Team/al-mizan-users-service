import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OperateursEconomiquesModule } from './operateurs-economiques/operateurs-economiques.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';
import { RolesModule } from './roles/roles.module';
import { ServicesContractantsModule } from './services-contractants/services-contractants.module';
import { UserRolesModule } from './user-roles/user-roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    RabbitMqModule,
    OrganisationsModule,
    ProfilesModule,
    ServicesContractantsModule,
    OperateursEconomiquesModule,
    RolesModule,
    UserRolesModule,
  ],
})
export class AppModule {}
