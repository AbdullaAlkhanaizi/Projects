use std::fs::File;

#[track_caller]
pub fn open_file(s: &str) -> File {
    File::open(s).unwrap()
}
