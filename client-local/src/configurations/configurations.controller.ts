import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ConfigurationsService } from './configurations.service';
import { CreateConfigurationDto, UpdateConfigurationDto } from './dto/configuration.dto';

@Controller('configurations')
export class ConfigurationsController {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    return this.configurationsService.findAll(category);
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    return this.configurationsService.findOne(key);
  }

  @Post()
  async create(@Body() createConfigurationDto: CreateConfigurationDto) {
    return this.configurationsService.create(createConfigurationDto);
  }

  @Put(':key')
  async update(
    @Param('key') key: string,
    @Body() updateConfigurationDto: UpdateConfigurationDto,
  ) {
    return this.configurationsService.update(key, updateConfigurationDto);
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    return this.configurationsService.remove(key);
  }
}