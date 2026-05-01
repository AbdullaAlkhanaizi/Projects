count=$(find . -type f -o -type d | wc -l | tr -d '[:space:]')

echo $count