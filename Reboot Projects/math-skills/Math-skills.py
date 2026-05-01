import statistics
import math

with open('data.txt', 'r') as file:
    data = file.readlines()

num = [int(line.strip()) for line in data]

average = statistics.mean(num)

variance = sum((x - average) ** 2 for x in num) / len(num)
stdev = math.sqrt(variance)

avg = round(average)
med = round(statistics.median(num))
var = round(variance)
std = round(stdev)

print(f"The average is: {avg}")
print(f"The median is: {med}")
print(f"The variance is: {var}")
print(f"The standard deviation is: {std}")
