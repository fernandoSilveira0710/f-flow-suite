import { PartialType } from '@nestjs/mapped-types';
import { CreateResourceTypeDto } from './create-resource-type.dto';

export class UpdateResourceTypeDto extends PartialType(CreateResourceTypeDto) {}