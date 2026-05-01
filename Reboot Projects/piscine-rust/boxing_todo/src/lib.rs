pub mod err;
pub use err::*;

use std::error::Error;
use std::fs;

#[derive(Debug, Eq, PartialEq)]
pub struct Task {
    pub id: u32,
    pub description: String,
    pub level: u32,
}

#[derive(Debug, Eq, PartialEq)]
pub struct TodoList {
    pub title: String,
    pub tasks: Vec<Task>,
}

impl TodoList {
    pub fn get_todo(path: &str) -> Result<TodoList, Box<dyn Error>> {
        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(e) => return Err(Box::new(err::ReadErr { child_err: Box::new(e) })),
        };

        let parsed = match json::parse(&content) {
            Ok(p) => p,
            Err(e) => return Err(Box::new(err::ParseErr::Malformed(Box::new(e)))),
        };

        let tasks_json = &parsed["tasks"];
        if tasks_json.is_null() || tasks_json.is_empty() {
            return Err(Box::new(err::ParseErr::Empty));
        }

        let title = parsed["title"].as_str().unwrap_or("").to_string();
        
        let mut tasks = Vec::new();
        for task in tasks_json.members() {
            tasks.push(Task {
                id: task["id"].as_u32().unwrap_or(0),
                description: task["description"].as_str().unwrap_or("").to_string(),
                level: task["level"].as_u32().unwrap_or(0),
            });
        }

        Ok(TodoList { title, tasks })
    }
}
