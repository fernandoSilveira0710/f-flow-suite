import { PartialType } from '@nestjs/mapped-types';
import { CreateGroomingTicketDto } from './create-grooming-ticket.dto';

export class UpdateGroomingTicketDto extends PartialType(CreateGroomingTicketDto) {}