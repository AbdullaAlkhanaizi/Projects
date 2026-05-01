
function matchCron(cron, date) {
    const [minPat, hourPat, domPat, monPat, dowPat] = cron.trim().split(/\s+/);

    const fieldMatches = (pat, value) => pat === '*' ? true : Number(pat) === value;

    const minute = date.getMinutes();
    const hour = date.getHours();
    const dom = date.getDate();
    const month = date.getMonth() + 1;

    const dow = ((date.getDay() + 6) % 7) + 1;

    return (
        fieldMatches(minPat, minute) &&  fieldMatches(hourPat, hour) && fieldMatches(domPat, dom) && fieldMatches(monPat, month) && fieldMatches(dowPat, dow)
    );
}


