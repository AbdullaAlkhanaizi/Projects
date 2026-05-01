fn main() {
    let mut trials = 0;

    loop {
        println!("I am the beginning of the end, and the end of time and space. I am essential to creation, and I surround every place. What am I?");
        trials += 1;

        let mut answer = String::new();
        std::io::stdin().read_line(&mut answer).unwrap();
        if answer.trim() == "The letter e" {
            println!("Number of trials: {}", trials);
            break;
        }
    }
}
