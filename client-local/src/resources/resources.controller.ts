import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto, ResourceResponseDto } from './dto';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.create(createResourceDto);
  }

  @Get()
  async findAll(): Promise<ResourceResponseDto[]> {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResourceResponseDto> {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateResourceDto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.resourcesService.remove(id);
  }
}