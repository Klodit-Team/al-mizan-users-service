import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';
import { ProfileEntity } from './entities/profile.entity';
import { DeleteResponseEntity } from '../organisations/entities/organisation.entity';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user profile' })
  @ApiResponse({ status: 201, type: ProfileEntity })
  create(@Body() dto: CreateProfileDto): Promise<any> {
    return this.profilesService.create(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get profile by user ID' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, type: ProfileEntity })
  getByUserId(@Param('userId') userId: string): Promise<any> {
    return this.profilesService.getByUserId(userId);
  }

  @Patch('user/:userId')
  @ApiOperation({ summary: 'Update profile by user ID' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, type: ProfileEntity })
  updateByUserId(@Param('userId') userId: string, @Body() dto: UpdateProfileDto): Promise<any> {
    return this.profilesService.updateByUserId(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by profile ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ProfileEntity })
  getById(@Param('id') id: string): Promise<any> {
    return this.profilesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update profile' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ProfileEntity })
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto): Promise<any> {
    return this.profilesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete profile' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: DeleteResponseEntity })
  delete(@Param('id') id: string): Promise<any> {
    return this.profilesService.delete(id);
  }
}