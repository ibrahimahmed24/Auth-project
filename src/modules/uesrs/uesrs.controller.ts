import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UesrsService } from './uesrs.service';
import { CreateUesrDto } from './dto/create-uesr.dto';
import { UpdateUesrDto } from './dto/update-uesr.dto';

@Controller('uesrs')
export class UesrsController {
  constructor(private readonly uesrsService: UesrsService) {}

  @Post()
  create(@Body() createUesrDto: CreateUesrDto) {
    return this.uesrsService.create(createUesrDto);
  }

  @Get()
  findAll() {
    return this.uesrsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uesrsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUesrDto: UpdateUesrDto) {
    return this.uesrsService.update(+id, updateUesrDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uesrsService.remove(+id);
  }
}
