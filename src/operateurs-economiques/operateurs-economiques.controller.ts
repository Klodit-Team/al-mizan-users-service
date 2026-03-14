import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { BlacklistOperateurDto } from './dto/blacklist-operateur.dto';
import { CreateOperateurEconomiqueDto } from './dto/create-operateur-economique.dto';
import { UpdateOperateurEconomiqueDto } from './dto/update-operateur-economique.dto';
import { OperateursEconomiquesService } from './operateurs-economiques.service';

@ApiTags('Operateurs Economiques')
@Controller('operateurs-economiques')
export class OperateursEconomiquesController {
  constructor(private readonly operateursEconomiquesService: OperateursEconomiquesService) {}

  @Post()
  create(@Body() dto: CreateOperateurEconomiqueDto) {
    return this.operateursEconomiquesService.create(dto);
  }

  @Get()
  list(@Query() dto: PaginationQueryDto) {
    return this.operateursEconomiquesService.list(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.operateursEconomiquesService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOperateurEconomiqueDto) {
    return this.operateursEconomiquesService.update(id, dto);
  }

  @Patch(':id/blacklist')
  blacklist(@Param('id') id: string, @Body() dto: BlacklistOperateurDto) {
    return this.operateursEconomiquesService.blacklist(id, dto);
  }

  @Patch(':id/unblacklist')
  unblacklist(@Param('id') id: string) {
    return this.operateursEconomiquesService.unblacklist(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.operateursEconomiquesService.delete(id);
  }
}
