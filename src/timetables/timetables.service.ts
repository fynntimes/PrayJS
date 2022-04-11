import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import PrayTimes from '../praytimes.js';
import { GetTimetableDto } from './dto/get-timetable.dto';
import {
  Timetable,
  TimetableDay,
  TimetableMonth,
  TimetableYear,
} from './entities/timetable.entity';

const lastDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

const asTimetableDay = (day: number, times: any) => {
  const ttd = new TimetableDay();
  ttd.day = day;
  ttd.imsak = times.imsak;
  ttd.fajr = times.fajr;
  ttd.sunrise = times.sunrise;
  ttd.dhuhr = times.dhuhr;
  ttd.asr = times.asr;
  ttd.maghrib = times.maghrib;
  ttd.isha = times.isha;
  ttd.midnight = times.midnight;
  return ttd;
};

const getCacheKey = (data: GetTimetableDto) => JSON.stringify(data);

const validateAndSanitize = (val: string, valids: Array<string>) => {
  for (let i = 0; i < valids.length; i++) {
    if (val.toLowerCase() === valids[i].toLowerCase()) {
      return valids[i];
    }
  }
  throw new BadRequestException(`format must be one of ${valids.join(',')}`);
};
@Injectable()
export class TimetablesService {
  private readonly prayTimes = PrayTimes();
  private readonly validMethods = [
    'MWL',
    'ISNA',
    'Egypt',
    'Makkah',
    'Karachi',
    'Tehran',
    'Jafari',
  ];
  private readonly validOutputFormats = ['24h', '12h', '12hNS', 'Float'];

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async generate(data: GetTimetableDto) {
    const start = data.startDate;
    const end = data.endDate ?? data.startDate;
    const coords = [data.latitude, data.longitude];
    const timezone = data.timezone;

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

    const format = data.format
      ? validateAndSanitize(data.format, this.validOutputFormats)
      : '12h';

    const method = data.method
      ? validateAndSanitize(data.method, this.validMethods)
      : 'Jafari';

    this.prayTimes.setMethod(method);

    const cachedValue = await this.cacheManager.get(getCacheKey(data));
    if (cachedValue) {
      return cachedValue;
    }

    const result = new Timetable();

    // Loops over every year-month-day combination from the start date
    // to the end date.
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
          // Here we finally have the year-month-day, so we generate times
          const times = this.prayTimes.getTimes(
            [+year, +month, +day],
            coords,
            timezone,
            0, // dst always false, let timezone encode DST status
            format,
          );
          resMonth.days.push(asTimetableDay(day, times));
        }

        resYear.months.push(resMonth);
      }

      result.years.push(resYear);
    }

    // use the day, month, year properties of timetable objects
    // as keys in the resultant API output.
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

    // cache this result so that we don't have to redo all this computation.
    // setting TTL to 0 ensures it never expires, since every input always returns
    // the same result.
    this.cacheManager.set(getCacheKey(data), formattedResult, { ttl: 0 });
    return formattedResult;
  }
}
