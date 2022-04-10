import { BadRequestException, Injectable } from '@nestjs/common';
import { GetTimetableDto } from './dto/get-timetable.dto';

import PrayTimes from '../praytimes.js';
import {
  Timetable,
  TimetableDay,
  TimetableMonth,
  TimetableYear,
} from './entities/timetable.entity';

const lastDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

@Injectable()
export class TimetablesService {
  private readonly prayTimes = PrayTimes();
  private validMethods = [
    'MWL',
    'ISNA',
    'Egypt',
    'Makkah',
    'Karachi',
    'Tehran',
    'Jafari',
  ];
  private validOutputFormats = ['24h', '12h', '12hNS', 'Float'];

  generate(data: GetTimetableDto) {
    const start = data.startDate;
    const end = data.endDate ?? data.startDate;
    const coords = [data.latitude, data.longitude];
    const { timezone, format = '12h', method = 'Jafari' } = data;
    const dst = 0;

    if (
      !data.startDate ||
      !data.latitude ||
      !data.longitude ||
      !data.timezone
    ) {
      throw new BadRequestException(
        'body must have startDate: {year, month, day}, latitude, longitude, and timezone.',
      );
    }

    if (this.validOutputFormats.indexOf(format) === -1) {
      throw new BadRequestException(
        `format must be one of ${this.validOutputFormats.join(',')}`,
      );
    }

    if (this.validMethods.indexOf(method) === -1) {
      throw new BadRequestException(
        `method must be one of ${this.validMethods.join(',')}`,
      );
    }

    this.prayTimes.setMethod(method);

    const result = new Timetable();
    for (let year = start.year; year <= end.year; year++) {
      const resYear = new TimetableYear(year);

      const monthLB = year == start.year ? start.month : 1;
      const monthUB = year == end.year ? end.month : 12;

      for (let month = monthLB; month <= monthUB; month++) {
        const resMonth = new TimetableMonth(month);

        const dayLB =
          year == start.year && month == start.month ? start.day : 1;
        const dayUB =
          year == end.year && month == end.month
            ? end.day
            : lastDayOfMonth(+year, +month);

        for (let day = dayLB; day <= dayUB; day++) {
          const resDay = new TimetableDay();
          resDay.day = day;
          console.log([year, month, day], coords, timezone, dst, format);
          const times = this.prayTimes.getTimes(
            [+year, +month, +day],
            coords,
            timezone,
            dst,
            format,
          );
          console.log(times);
          resDay.imsak = times.imsak;
          resDay.fajr = times.fajr;
          resDay.sunrise = times.sunrise;
          resDay.dhuhr = times.dhuhr;
          resDay.asr = times.asr;
          resDay.maghrib = times.maghrib;
          resDay.isha = times.isha;
          resDay.midnight = times.midnight;

          resMonth.days.push(resDay);
        }

        resYear.months.push(resMonth);
      }

      result.years.push(resYear);
    }

    const formattedResult: any = {};
    result.years.forEach((y) => {
      const formattedYear = {};
      y.months.forEach((m) => {
        const formattedMonth = {};
        m.days.forEach((d) => (formattedMonth[d.day] = d));
        formattedYear[m.month] = formattedMonth;
      });
      formattedResult[y.year] = formattedYear;
    });

    return formattedResult;
  }
}
