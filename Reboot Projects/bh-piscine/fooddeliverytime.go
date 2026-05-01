package piscine

type food struct {
	preptime int
	burger   string
	chips    string
	nuggets  string
}

func FoodDeliveryTime(order string) int {
	preptime := 0

	if order == "burger" {
		preptime += 15
	} else if order == "chips" {
		preptime += 10
	} else if order == "nuggets" {
		preptime += 12
	} else {
		return 404
	}

	return preptime
}
