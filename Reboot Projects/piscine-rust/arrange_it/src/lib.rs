pub fn arrange_phrase(phrase: &str) -> String {
    let mut ordered = vec![""; phrase.split_whitespace().count()];

    for word in phrase.split_whitespace() {
        let position = word
            .chars()
            .find(|ch| ch.is_ascii_digit())
            .and_then(|ch| ch.to_digit(10))
            .unwrap() as usize;

        ordered[position - 1] = word;
    }

    let mut result = String::with_capacity(phrase.len().saturating_sub(ordered.len()));

    for (i, word) in ordered.iter().enumerate() {
        if i > 0 {
            result.push(' ');
        }

        for ch in word.chars() {
            if !ch.is_ascii_digit() {
                result.push(ch);
            }
        }
    }

    result
}
