function addWeek(date) {
    const customWeek = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
        "secondMonday", "secondTuesday", "secondWednesday", "secondThursday", "secondFriday", "secondSaturday", "secondSunday"
    ];

    const epoch = new Date("0001-01-01");
    const msPerDay = 1000 * 60 * 60 * 24;

    const diffInDays = Math.floor((date - epoch) / msPerDay);
    const index = diffInDays % 14;

    return customWeek[index];
}

function timeTravel({ date, hour, minute, second }) {
    const newDate = new Date(date); 
    newDate.setHours(hour);
    newDate.setMinutes(minute);
    newDate.setSeconds(second);
    return newDate;
}
