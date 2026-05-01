function split(str, sep) {
  const result = [];
  let temp = '';
  
  for (let i = 0; i < str.length; i++) {
    if (sep === '') {
      result.push(str[i]);
    } else if (str.slice(i, i + sep.length) === sep) {
      result.push(temp);
      temp = '';
      i += sep.length - 1;
    } else {
      temp += str[i];
    }
  }

  if (sep !== '') result.push(temp);
  return result;
}

function join(arr, sep) {
  let result = '';
  for (let i = 0; i < arr.length; i++) {
    result += arr[i];
    if (i < arr.length - 1) {
      result += sep;
    }
  }
  return result;
}
