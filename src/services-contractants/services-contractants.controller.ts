import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateServiceContractantDto } from './dto/create-service-contractant.dto';
import { UpdateServiceContractantDto } from './dto/update-service-contractant.dto';
import { ServicesContractantsService } from './services-contractants.service';

@ApiTags('Services Contractants')
@Controller('services-contractants')
export class ServicesContractantsController {
  constructor(private readonly servicesContractantsService: ServicesContractantsService) {}

  @Post()
  create(@Body() dto: CreateServiceContractantDto) {
    return this.servicesContractantsService.create(dto);
  }

  @Get()
  list(@Query() dto: PaginationQueryDto) {
    return this.servicesContractantsService.list(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.servicesContractantsService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceContractantDto) {
    return this.servicesContractantsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.servicesContractantsService.delete(id);
  }
}
