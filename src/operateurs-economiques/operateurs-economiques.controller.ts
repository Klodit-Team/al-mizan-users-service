import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { BlacklistOperateurDto } from './dto/blacklist-operateur.dto';
import { CreateOperateurEconomiqueDto } from './dto/create-operateur-economique.dto';
import { UpdateOperateurEconomiqueDto } from './dto/update-operateur-economique.dto';
import { OperateursEconomiquesService } from './operateurs-economiques.service';
import { OperateurEconomiqueEntity, PaginatedOperateurEconomiqueEntity } from './entities/operateur-economique.entity';
import { DeleteResponseEntity } from '../organisations/entities/organisation.entity';

@ApiTags('Operateurs Economiques')
@Controller('operateurs-economiques')
export class OperateursEconomiquesController {
  constructor(private readonly operateursEconomiquesService: OperateursEconomiquesService) {}

  @Post()
  @ApiOperation({ summary: 'Create operateur economique' })
  @ApiResponse({ status: 201, type: OperateurEconomiqueEntity })
  create(@Body() dto: CreateOperateurEconomiqueDto): Promise<any> {
    return this.operateursEconomiquesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List operateurs economiques' })
  @ApiResponse({ status: 200, type: PaginatedOperateurEconomiqueEntity })
  list(@Query() dto: PaginationQueryDto): Promise<any> {
    return this.operateursEconomiquesService.list(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get operateur economique by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OperateurEconomiqueEntity })
  getById(@Param('id') id: string): Promise<any> {
    return this.operateursEconomiquesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update operateur economique' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OperateurEconomiqueEntity })
  update(@Param('id') id: string, @Body() dto: UpdateOperateurEconomiqueDto): Promise<any> {
    return this.operateursEconomiquesService.update(id, dto);
  }

  @Patch(':id/blacklist')
  @ApiOperation({ summary: 'Blacklist operateur economique' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OperateurEconomiqueEntity })
  blacklist(@Param('id') id: string, @Body() dto: BlacklistOperateurDto): Promise<any> {
    return this.operateursEconomiquesService.blacklist(id, dto);
  }

  @Patch(':id/unblacklist')
  @ApiOperation({ summary: 'Remove operateur economique from blacklist' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OperateurEconomiqueEntity })
  unblacklist(@Param('id') id: string): Promise<any> {
    return this.operateursEconomiquesService.unblacklist(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete operateur economique' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: DeleteResponseEntity })
  delete(@Param('id') id: string): Promise<any> {
    return this.operateursEconomiquesService.delete(id);
  }
}