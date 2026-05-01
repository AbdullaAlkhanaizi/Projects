find . -name "*.sh" | while read path; do
    basename "$path" .sh
done | sort -r