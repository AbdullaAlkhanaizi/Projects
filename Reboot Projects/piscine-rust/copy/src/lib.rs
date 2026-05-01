pub fn nbr_function(c: i32) -> (i32, f64, f64) {
    let value = c as f64;
    (c, value.exp(), (c.abs() as f64).ln())
}

pub fn str_function(a: String) -> (String, String) {
    let exp_values = a
        .split_whitespace()
        .map(|value| value.parse::<f64>().unwrap().exp().to_string())
        .collect::<Vec<_>>()
        .join(" ");

    (a, exp_values)
}

pub fn vec_function(b: Vec<i32>) -> (Vec<i32>, Vec<f64>) {
    let logs = b.iter().map(|value| (value.abs() as f64).ln()).collect();
    (b, logs)
}
