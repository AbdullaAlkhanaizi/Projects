function multiply(a, b) {
    let result = 0;
    const positive = Math.abs(b);
    for (let i = 0; i < positive; i++) {
        result += a;
    }
    return b < 0 ? -result : result;
}

function divide(a, b) {
    if (b === 0) {
        return "invalid number"
    }

    const negative = (a < 0) !== (b < 0);
    let dividend = Math.abs(a);
    const divisor = Math.abs(b);
    let quotient = 0;

    while (dividend >= divisor) {
        dividend -= divisor;
        quotient++;
    }

    return negative ? -quotient : quotient;
}

function modulo(a, b) {
    if (b === 0) {
        return "invalid number"
    }
    const quotient = divide(a, b);
    const product = multiply(quotient, b);
    return a - product;
}

