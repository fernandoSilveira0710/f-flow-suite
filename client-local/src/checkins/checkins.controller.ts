import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query 
} from '@nestjs/common';
import { CheckInsService } from './checkins.service';
import { CreateCheckInDto, CheckOutDto, CheckInResponseDto } from './dto';

@Controller('checkins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post('checkin')
  async checkIn(@Body() createCheckInDto: CreateCheckInDto): Promise<CheckInResponseDto> {
    return this.checkInsService.checkIn(createCheckInDto);
  }

  @Post('checkout/:id')
  async checkOut(
    @Param('id') id: string,
    @Body() checkOutDto?: CheckOutDto
  ): Promise<CheckInResponseDto> {
    return this.checkInsService.checkOut(id, checkOutDto);
  }

  @Get()
  async findAll(
    @Query('petId') petId?: string,
    @Query('professionalId') professionalId?: string,
    @Query('activeOnly') activeOnly?: string
  ): Promise<CheckInResponseDto[]> {
    const isActiveOnly = activeOnly === 'true';
    return this.checkInsService.findAll(petId, professionalId, isActiveOnly);
  }

  @Get('active/pet/:petId')
  async findActiveByPet(@Param('petId') petId: string): Promise<CheckInResponseDto | null> {
    return this.checkInsService.findActiveCheckInByPet(petId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CheckInResponseDto> {
    return this.checkInsService.findOne(id);
  }
}