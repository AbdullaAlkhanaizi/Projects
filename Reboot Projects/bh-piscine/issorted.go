package piscine

func IsSorted(f func(a, b int) int, a []int) bool {
	countp := 0
	counte := 0
	countn := 0
	for i := 0; i < len(a)-1; i++ {
		if f(a[i], a[i+1]) >= 1 {
			countp++
		} else if f(a[i], a[i+1]) == 0 {
			counte++
		} else if f(a[i], a[i+1]) <= -1 {
			countn++
		}
	}
	if countp == len(a)-1 || countn == (len(a)-1) || counte == len(a)-1 {
		return true
	} else {
		return false
	}
}
