package functions

import (
	"netcatclone/structs"
)

func ValidName(name string) bool {
	if name == "" {
		return false
	}
	for _, ch := range name {
		if ch >= 32 && ch <= 126 {
			continue
		} else {
			return false
		}
	}
	for _, ch := range structs.Clients {
		if name == ch.Name {
			return false
		}
	}
	return true
}
