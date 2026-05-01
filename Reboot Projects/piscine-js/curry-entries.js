
function defaultCurry(obj1) {
    return function (obj2) {
        return { ...obj1, ...obj2 };
    };
}

function mapCurry(fn) {
    return function (obj) {
        return Object.fromEntries(
            Object.entries(obj).map(entry => fn(entry))
        );
    };
}

function reduceCurry(fn) {
    return function (obj, initial) {
        return Object.entries(obj).reduce((acc, entry) => fn(acc, entry), initial);
    };
}



function filterCurry(fn) {
    return function (obj) {
        return Object.fromEntries(
            Object.entries(obj).filter(entry => fn(entry))
        );
    };
}


function reduceScore(personnel, initial = 0) {
    return reduceCurry((acc, [_, v]) => {
        if (v.isForceUser) {
            return acc + v.pilotingScore + v.shootingScore;
        }
        return acc;
    })(personnel, initial);
}


function filterForce(personnel) {
    return filterCurry(([_, v]) => v.isForceUser && v.shootingScore >= 80)(personnel);
}

function mapAverage(personnel) {
    return mapCurry(([k, v]) => {
        const avg = (v.pilotingScore + v.shootingScore) / 2;
        return [k, { ...v, averageScore: avg }];
    })(personnel);
}
