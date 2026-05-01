function indexOf(arr, value, opt) {
    if (opt == null) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === value)
                return i
        } return -1
    } else {
        for (let i = opt; i < arr.length; i++) {
            if (arr[i] === value)
                return i
        } return -1
    }
}

function lastIndexOf(arr, value, opt) {
    if (opt == null) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i] === value) return i;
        }
        return -1;
    } else {
        for (let i = opt; i >= 0; i--) {
            if (arr[i] === value) return i;
        }
        return -1;
    }
}

function includes(arr, value) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === value) {
            return true
        }
    }
    return false
}

