import { CacheModule, Module } from '@nestjs/common';
import { TimetablesService } from './timetables.service';
import { TimetablesController } from './timetables.controller';

@Module({
  controllers: [TimetablesController],
  providers: [TimetablesService],
  imports: [CacheModule.register()],
})
export class TimetablesModule {}
