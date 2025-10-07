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
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto, UpdateProfessionalDto, ProfessionalResponseDto } from './dto';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createProfessionalDto: CreateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.professionalsService.create(createProfessionalDto);
  }

  @Get()
  async findAll(): Promise<ProfessionalResponseDto[]> {
    return this.professionalsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProfessionalResponseDto> {
    return this.professionalsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateProfessionalDto: UpdateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.professionalsService.update(id, updateProfessionalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.professionalsService.remove(id);
  }
}