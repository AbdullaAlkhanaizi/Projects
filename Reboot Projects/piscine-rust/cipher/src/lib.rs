#[derive(Debug, PartialEq, Eq)]
pub struct CipherError {
    pub expected: String,
}

pub fn cipher(original: &str, ciphered: &str) -> Result<(), CipherError> {
    let mut expected = String::with_capacity(original.len());
    for c in original.chars() {
        if c.is_ascii_lowercase() {
            expected.push((219 - c as u8) as char);
        } else if c.is_ascii_uppercase() {
            expected.push((155 - c as u8) as char);
        } else {
            expected.push(c);
        }
    }
    
    if expected == ciphered {
        Ok(())
    } else {
        Err(CipherError { expected })
    }
}
