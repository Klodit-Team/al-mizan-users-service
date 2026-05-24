import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  create(@Body() dto: CreateProfileDto) {
    return this.profilesService.create(dto);
  }

  @Get('user/:userId')
  getByUserId(@Param('userId') userId: string) {
    return this.profilesService.getByUserId(userId);
  }

  @Patch('user/:userId')
  updateByUserId(@Param('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profilesService.updateByUserId(userId, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.profilesService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.profilesService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.profilesService.delete(id);
  }
}
