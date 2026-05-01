pub fn first_subword(mut s: String) -> String {
    for (idx, ch) in s.char_indices().skip(1) {
        if ch == '_' || ch.is_uppercase() {
            s.truncate(idx);
            break;
        }
    }

    s
}
