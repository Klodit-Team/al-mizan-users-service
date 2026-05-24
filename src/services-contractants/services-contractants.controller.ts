import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateServiceContractantDto } from './dto/create-service-contractant.dto';
import { UpdateServiceContractantDto } from './dto/update-service-contractant.dto';
import { ServicesContractantsService } from './services-contractants.service';
import { ServiceContractantEntity, PaginatedServiceContractantEntity, ServiceContractantProfileEntity } from './entities/service-contractant.entity';
import { DeleteResponseEntity } from '../organisations/entities/organisation.entity';

@ApiTags('Services Contractants')
@Controller('services-contractants')
export class ServicesContractantsController {
  constructor(private readonly servicesContractantsService: ServicesContractantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create service contractant' })
  @ApiResponse({ status: 201, type: ServiceContractantEntity })
  create(@Body() dto: CreateServiceContractantDto): Promise<any> {
    return this.servicesContractantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List services contractants' })
  @ApiResponse({ status: 200, type: PaginatedServiceContractantEntity })
  list(@Query() dto: PaginationQueryDto): Promise<any> {
    return this.servicesContractantsService.list(dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get own service contractant profile' })
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiResponse({ status: 200, type: ServiceContractantProfileEntity })
  async getProfile(@Headers('x-user-id') userId: string): Promise<any> {
    return this.servicesContractantsService.getProfileByUserId(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update own service contractant profile' })
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiResponse({ status: 200, type: ServiceContractantProfileEntity })
  async updateProfile(@Headers('x-user-id') userId: string, @Body() dto: UpdateServiceContractantDto): Promise<any> {
    return this.servicesContractantsService.updateProfileByUserId(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service contractant by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ServiceContractantEntity })
  getById(@Param('id') id: string): Promise<any> {
    return this.servicesContractantsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service contractant' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ServiceContractantEntity })
  update(@Param('id') id: string, @Body() dto: UpdateServiceContractantDto): Promise<any> {
    return this.servicesContractantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service contractant' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: DeleteResponseEntity })
  delete(@Param('id') id: string): Promise<any> {
    return this.servicesContractantsService.delete(id);
  }
}