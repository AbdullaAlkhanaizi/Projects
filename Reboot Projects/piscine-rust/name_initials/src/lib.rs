pub fn initials(names: Vec<&str>) -> Vec<String> {
    names
        .into_iter()
        .map(|name| {
            let words = name.split_whitespace();
            let count = words.clone().count();
            let mut result = String::with_capacity(count.saturating_mul(3).saturating_sub(1));

            for (i, word) in words.enumerate() {
                if i > 0 {
                    result.push(' ');
                }

                if let Some(initial) = word.chars().next() {
                    result.push(initial);
                    result.push('.');
                }
            }

            result
        })
        .collect()
}
