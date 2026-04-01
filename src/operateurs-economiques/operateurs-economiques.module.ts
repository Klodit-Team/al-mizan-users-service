import { Module } from '@nestjs/common';
import { OperateursEconomiquesController } from './operateurs-economiques.controller';
import { OperateursEconomiquesService } from './operateurs-economiques.service';

@Module({
  controllers: [OperateursEconomiquesController],
  providers: [OperateursEconomiquesService],
  exports: [OperateursEconomiquesService],
})
export class OperateursEconomiquesModule {}
