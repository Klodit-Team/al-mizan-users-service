import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { ListOrganisationsDto } from './dto/list-organisations.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsService } from './organisations.service';
import { OrganisationEntity, PaginatedOrganisationEntity, DeleteResponseEntity } from './entities/organisation.entity';

@ApiTags('Organisations')
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  @ApiOperation({ summary: 'Register an organisation' })
  @ApiResponse({ status: 201, type: OrganisationEntity })
  create(@Body() dto: CreateOrganisationDto): Promise<any> {
    return this.organisationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List organisations' })
  @ApiResponse({ status: 200, type: PaginatedOrganisationEntity })
  list(@Query() dto: ListOrganisationsDto): Promise<any> {
    return this.organisationsService.list(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organisation by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OrganisationEntity })
  getById(@Param('id') id: string): Promise<any> {
    return this.organisationsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organisation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OrganisationEntity })
  update(@Param('id') id: string, @Body() dto: UpdateOrganisationDto): Promise<any> {
    return this.organisationsService.update(id, dto);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify an organisation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OrganisationEntity })
  verify(@Param('id') id: string): Promise<any> {
    return this.organisationsService.verify(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organisation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: DeleteResponseEntity })
  delete(@Param('id') id: string): Promise<any> {
    return this.organisationsService.delete(id);
  }
}