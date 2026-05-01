pub enum Security {
    Unknown,
    Message,
    Warning,
    NotFound,
    UnexpectedUrl,
}

pub fn fetch_data(server: Result<&str, &str>, security_level: Security) -> String {
    match security_level {
        // Uses standard unwrap
        Security::Unknown => server.unwrap().to_string(),
        
        // Uses unwrap_or_else to guarantee the exact panic message without the original error attached
        Security::Message => server
            .unwrap_or_else(|_| panic!("ERROR: program stops"))
            .to_string(),
            
        // Uses unwrap_or for the default warning fallback
        Security::Warning => server
            .unwrap_or("WARNING: check the server")
            .to_string(),
            
        // Maps the Ok value, then uses unwrap_or_else to format the Err value
        Security::NotFound => server
            .map(|url| url.to_string())
            .unwrap_or_else(|err| format!("Not found: {}", err)),
            
        // Extracts the error, or panics with the Ok value if no error exists
        Security::UnexpectedUrl => server
            .err()
            .unwrap_or_else(|| panic!("{}", server.unwrap()))
            .to_string(),
    }
}