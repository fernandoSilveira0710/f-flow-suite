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
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto } from './dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  async findAll(): Promise<ServiceResponseDto[]> {
    return this.servicesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ServiceResponseDto> {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.servicesService.remove(id);
  }
}