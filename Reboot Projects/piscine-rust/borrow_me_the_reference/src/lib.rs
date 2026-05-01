pub fn delete_and_backspace(s: &mut String) {
    let mut result = String::with_capacity(s.len());
    let mut pending_delete = 0usize;

    for ch in s.chars() {
        match ch {
            '-' => {
                result.pop();
            }
            '+' => {
                pending_delete += 1;
            }
            _ if pending_delete > 0 => {
                pending_delete -= 1;
            }
            _ => result.push(ch),
        }
    }

    *s = result;
}

pub fn do_operations(v: &mut [String]) {
    for expr in v.iter_mut() {
        let result = if let Some((left, right)) = expr.split_once('+') {
            left.parse::<i32>().unwrap() + right.parse::<i32>().unwrap()
        } else if let Some((left, right)) = expr.split_once('-') {
            left.parse::<i32>().unwrap() - right.parse::<i32>().unwrap()
        } else {
            continue;
        };

        *expr = result.to_string();
    }
}
