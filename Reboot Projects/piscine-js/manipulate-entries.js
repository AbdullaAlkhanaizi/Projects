
function filterEntries(obj, callback) {
    return Object.fromEntries(
        Object.entries(obj).filter(([k, v]) => callback([k, v]))
    );
}

function mapEntries(obj, callback) {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => callback([k, v]))
    );
}

function reduceEntries(obj, callback, initialValue) {
    return Object.entries(obj).reduce(
        (acc, [k, v]) => callback(acc, [k, v]),
        initialValue
    );
}


function totalCalories(cart) {
    const total = reduceEntries(cart, (acc, [item, grams]) => {
        const data = nutritionDB[item];
        return data ? acc + (data.calories * grams) / 100 : acc;
    }, 0);
    return Math.round(total * 10) / 10;
}


function lowCarbs(cart) {
    return filterEntries(cart, ([item, grams]) => {
        const data = nutritionDB[item];
        return data ? (data.carbs * grams) / 100 < 50 : false;
    });
}

function cartTotal(cart) {
    return mapEntries(cart, ([item, grams]) => {
        const data = nutritionDB[item];
        const factor = grams / 100;
        const totals = {};

        for (const nutrient in data) {
            totals[nutrient] = Number((data[nutrient] * factor).toFixed(3));
        }

        return [item, totals];
    });
}


