function cutFirst(x) {
    let temp = ""
    if (x.length==1){
        return ""
    }
    if (x.length < 2) {
        return x[0]
    }
    for (let i = 2; i < x.length; i++) {
        temp += x[i]
    }
    return temp
}
function cutLast(x) {
    let temp = ""
    if (x.length==1){
        return ""
    }
    if (x.length < 2) {
        return x[0]
    }
    
    for (let i = 0; i < x.length - 2; i++) {
        temp += x[i]
    }
    return temp
}
function cutFirstLast(x) {
    let temp = ""
    if (x.length==1){
        return ""
    }
    if (x.length < 2) {
        return x[0]
    }
    
    for (let i = 2; i < x.length - 2; i++) {
        temp += x[i]
    }
    return temp
}

function keepFirst(x) {
    let temp = ""
    if (x.length < 2) {
        return x[0]
    }
    
    for (let i = 0; i < 2; i++) {
        temp += x[i]
    }
    return temp
}

function keepLast(x) {
    let temp = ""
    
    if (x.length < 2) {
        return x[0]
    }
    
    for (let i = x.length - 2; i < x.length; i++) {
        temp += x[i]
    }
    return temp
}

function keepFirstLast(x) {
    if (x.length <= 4) {
        return x;
    }

    let firstTwo = x[0] + x[1];
    let lastTwo = x[x.length - 2] + x[x.length - 1];

    return firstTwo + lastTwo;
}



