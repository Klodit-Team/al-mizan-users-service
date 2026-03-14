import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { ListOrganisationsDto } from './dto/list-organisations.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsService } from './organisations.service';

@ApiTags('Organisations')
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  create(@Body() dto: CreateOrganisationDto) {
    return this.organisationsService.create(dto);
  }

  @Get()
  list(@Query() dto: ListOrganisationsDto) {
    return this.organisationsService.list(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.organisationsService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrganisationDto) {
    return this.organisationsService.update(id, dto);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.organisationsService.verify(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.organisationsService.delete(id);
  }
}
