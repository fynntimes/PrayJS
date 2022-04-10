export class TimetableDay {
  day: number;
  imsak: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string;
}

export class TimetableMonth {
  constructor(public month: number, public days: Array<TimetableDay> = []) {}
}

export class TimetableYear {
  constructor(public year: number, public months: Array<TimetableMonth> = []) {}
}

export class Timetable {
  years: Array<TimetableYear> = [];
}
