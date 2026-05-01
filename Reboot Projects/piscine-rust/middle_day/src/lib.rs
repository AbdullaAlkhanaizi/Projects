pub fn middle_day(year: u32) -> Option<chrono::Weekday> {
    // Check if the year has an even number of days (leap year)
    let is_leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    if is_leap {
        return None;
    }

    // The Gregorian calendar repeats exactly every 400 years (146097 days, which is a multiple of 7).
    // We can map any u32 year to a year in the range 1..=400 to avoid out-of-bounds issues 
    // and to safely fit into an i32 for chrono.
    let mapped_year = match year % 400 {
        0 => 400,
        y => y,
    } as i32;

    // The middle day of a 365-day year is the 183rd day.
    chrono::NaiveDate::from_yo_opt(mapped_year, 183)
        .map(|date| chrono::Datelike::weekday(&date))
}
