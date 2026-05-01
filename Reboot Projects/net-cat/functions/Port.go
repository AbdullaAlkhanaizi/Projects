package functions

import (
	"netcatclone/structs"
)

func Port(Args []string) string {
	if len(Args) > 2 {
		return "e1"
	}
	if len(Args) == 2 {
		for _, arg := range Args[1] {
			if arg < '0' || arg > '9' {
				return "e2"
			}
		}
		return ":" + Args[1]
	}
	return ":" + structs.Defaultport
}
