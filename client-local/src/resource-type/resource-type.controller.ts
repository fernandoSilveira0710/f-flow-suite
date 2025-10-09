import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
} from '@nestjs/common';
import { ResourceTypeService } from './resource-type.service';
import { CreateResourceTypeDto } from './dto/create-resource-type.dto';
import { UpdateResourceTypeDto } from './dto/update-resource-type.dto';

@Controller('resource-types')
export class ResourceTypeController {
  constructor(private readonly resourceTypeService: ResourceTypeService) {}

  @Post()
  create(@Body(ValidationPipe) createResourceTypeDto: CreateResourceTypeDto) {
    return this.resourceTypeService.create(createResourceTypeDto);
  }

  @Get()
  findAll() {
    return this.resourceTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourceTypeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateResourceTypeDto: UpdateResourceTypeDto,
  ) {
    return this.resourceTypeService.update(id, updateResourceTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resourceTypeService.remove(id);
  }
}