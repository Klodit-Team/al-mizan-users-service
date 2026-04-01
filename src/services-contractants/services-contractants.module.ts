import { Module } from '@nestjs/common';
import { ServicesContractantsController } from './services-contractants.controller';
import { ServicesContractantsService } from './services-contractants.service';

@Module({
  controllers: [ServicesContractantsController],
  providers: [ServicesContractantsService],
  exports: [ServicesContractantsService],
})
export class ServicesContractantsModule {}
