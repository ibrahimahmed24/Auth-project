import { PartialType } from '@nestjs/mapped-types';
import { CreateUesrDto } from './create-uesr.dto';

export class UpdateUesrDto extends PartialType(CreateUesrDto) {}
