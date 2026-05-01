use std::collections::HashMap;

pub fn mean(list: &[i32]) -> f64 {
    let sum: i32 = list.iter().sum();
    sum as f64 / list.len() as f64
}

pub fn median(list: &[i32]) -> i32 {
    let mut v = list.to_vec();
    v.sort_unstable();

    let len = v.len();
    if len % 2 == 1 {
        v[len / 2]
    } else {
        (v[len / 2 - 1] + v[len / 2]) / 2
    }
}

pub fn mode(list: &[i32]) -> i32 {
    let mut freq = HashMap::new();

    for &num in list {
        *freq.entry(num).or_insert(0) += 1;
    }

    let mut max_count = 0;
    let mut mode = 0;

    for (num, count) in freq {
        if count > max_count {
            max_count = count;
            mode = num;
        }
    }

    mode
}