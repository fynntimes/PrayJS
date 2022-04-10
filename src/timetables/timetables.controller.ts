import { Body, Controller, Get } from '@nestjs/common';
import { GetTimetableDto } from './dto/get-timetable.dto';
import { TimetablesService } from './timetables.service';

@Controller('timetables')
export class TimetablesController {
  constructor(private readonly timetablesService: TimetablesService) {}

  @Get()
  generate(@Body() getTimetableDto: GetTimetableDto) {
    return this.timetablesService.generate(getTimetableDto);
  }
}
