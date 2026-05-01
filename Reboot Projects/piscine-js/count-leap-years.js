function countLeapYears(date) {
  const year = date.getFullYear() - 1;

  const leapYears =
    Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400);

  return leapYears;
}
