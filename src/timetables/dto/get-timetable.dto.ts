export class SimpleDate {
  /** the Gregorian year */
  year: number;
  /** the Gregorian month */
  month: number;
  /** the Gregorian day */
  day: number;
}

export class GetTimetableDto {
  /** the start date to calculate times for */
  startDate: SimpleDate;
  /** the end date to calculate times for.
   * if the end date is the same as the start date, leave blank. */
  endDate?: SimpleDate;

  /** floating point value between -90 and 90 */
  latitude: number;
  /** floating point value between -180 and 180 */
  longitude: number;

  /** difference from GMT in hours (ex: EST is -5, EDT is -4) */
  timezone: number;

  /** output time format, one of 24h (16:45), 12h (4:45 pm),
   * 12hNS (no suffix, i.e. 4:45), or Float (16.75).
   * to default to 12h, leave blank. */
  format?: string;

  /** calculation method. one of MWL, ISNA, Egypt, Makkah, Karachi, Tehran, or Jafari.
   *  to default to Jafari, leave blank. */
  method?: string;
}
