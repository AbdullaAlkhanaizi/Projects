pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut prev = 0;
            let mut curr = 1;

            for _ in 2..=n {
                let next = prev + curr;
                prev = curr;
                curr = next;
            }

            curr
        }
    }
}
