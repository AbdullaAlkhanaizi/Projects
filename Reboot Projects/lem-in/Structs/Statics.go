package Structs

type Rooms struct { // Used for Rooms
	Linkedrooms []string
	Level       int
}

type CompleatedPath struct {
	Path   string
	Weight int
}

type SimPath struct {
	Rooms     []string
	Length    int
	Assigned  int
	Injected  int
	Positions []int
}


type Node struct {
	Room string
	Dist int
}