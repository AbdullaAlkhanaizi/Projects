#[derive(Debug, Eq, PartialEq)]
pub struct FormError {
    pub form_values: (&'static str, String),
    pub date: String,
    pub err: &'static str,
}

impl FormError {
    pub fn new(field_name: &'static str, field_value: String, err: &'static str) -> Self {
        use std::time::{SystemTime, UNIX_EPOCH};

        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        let mut seconds = now;
        let mut days = seconds / 86400;
        seconds %= 86400;
        
        let hours = seconds / 3600;
        seconds %= 3600;
        let minutes = seconds / 60;
        let secs = seconds % 60;
        
        let mut year = 1970;
        loop {
            let is_leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
            let days_in_year = if is_leap { 366 } else { 365 };
            if days >= days_in_year {
                days -= days_in_year;
                year += 1;
            } else {
                break;
            }
        }
        
        let is_leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        let mut month = 1;
        let days_in_month = [
            31, if is_leap { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
        ];
        
        for &dim in &days_in_month {
            if days >= dim {
                days -= dim;
                month += 1;
            } else {
                break;
            }
        }
        
        let day = days + 1;
        let date = format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02}", year, month, day, hours, minutes, secs);
        
        Self {
            form_values: (field_name, field_value),
            date,
            err,
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
pub struct Form {
    pub name: String,
    pub password: String,
}

impl Form {
    pub fn validate(&self) -> Result<(), FormError> {
        if self.name.is_empty() {
            return Err(FormError::new("name", "".to_owned(), "Username is empty"));
        }
        if self.password.len() < 8 {
            return Err(FormError::new(
                "password",
                self.password.clone(),
                "Password should be at least 8 characters long",
            ));
        }
        
        let has_num = self.password.chars().any(|c| c.is_ascii_digit());
        let has_letter = self.password.chars().any(|c| c.is_ascii_alphabetic());
        let has_symbol = self.password.chars().any(|c| !c.is_ascii_alphanumeric());
        
        if !(has_num && has_letter && has_symbol) {
            return Err(FormError::new(
                "password",
                self.password.clone(),
                "Password should be a combination of ASCII numbers, letters and symbols",
            ));
        }
        
        Ok(())
    }
}
