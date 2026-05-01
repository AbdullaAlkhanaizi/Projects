function isFriday(date) {
  return date.getDay() === 5;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isLeapYear(date) {
  const year = date.getFullYear();
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function isLastDayOfMonth(date) {
  const test = new Date(date);
  test.setDate(test.getDate() + 1);
  return test.getDate() === 1;
}
