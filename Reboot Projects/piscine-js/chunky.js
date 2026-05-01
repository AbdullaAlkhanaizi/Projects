function chunk(arr, size) {
  const result = [];

  for (let i = 0; i < arr.length; i += size) {
    const sub = [];
    for (let j = 0; j < size && i + j < arr.length; j++) {
      sub.push(arr[i + j]);
    }
    result.push(sub);
  }

  return result;
}
