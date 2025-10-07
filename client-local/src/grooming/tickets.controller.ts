import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateGroomingTicketDto } from './dto/create-grooming-ticket.dto';
import { UpdateGroomingTicketDto } from './dto/update-grooming-ticket.dto';
import { CreateGroomingItemDto } from './dto/create-grooming-item.dto';

@Controller('grooming/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateGroomingTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    // TODO: Implementar filtro por status se necessário
    return this.ticketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() createItemDto: CreateGroomingItemDto) {
    return this.ticketsService.addItem(id, createItemDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateGroomingTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}