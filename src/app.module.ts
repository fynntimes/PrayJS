import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TimetablesModule } from './timetables/timetables.module';

@Module({
  imports: [TimetablesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
