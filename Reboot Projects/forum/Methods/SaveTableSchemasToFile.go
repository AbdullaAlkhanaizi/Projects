package Methods

import (
	"database/sql"
	"fmt"
	"os"
)

func SaveTableSchemasToFile(dbPath, outputFile string) error {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open DB: %w", err)
	}
	defer db.Close()

	rows, err := db.Query(`SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
	if err != nil {
		return fmt.Errorf("failed to query table schemas: %w", err)
	}
	defer rows.Close()

	file, err := os.Create(outputFile)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer file.Close()

	for rows.Next() {
		var tableName, createSQL string
		if err := rows.Scan(&tableName, &createSQL); err != nil {
			return err
		}

		// Write schema with some formatting
		file.WriteString(fmt.Sprintf("-- Table: %s\n", tableName))
		file.WriteString(createSQL + ";\n\n")
	}

	return nil
}
func InspectDatabase(dbPath string) error {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open DB: %w", err)
	}
	defer db.Close()

	// Get all table names
	tables, err := db.Query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
	if err != nil {
		return fmt.Errorf("failed to query tables: %w", err)
	}
	defer tables.Close()

	for tables.Next() {
		var tableName string
		tables.Scan(&tableName)
		fmt.Printf("\n Table: %s\n", tableName)

		// Get table schema
		var schema string
		row := db.QueryRow("SELECT sql FROM sqlite_master WHERE name=?", tableName)
		row.Scan(&schema)
		fmt.Printf("Schema: %s\n", schema)

		// Get all rows
		rows, err := db.Query(fmt.Sprintf("SELECT * FROM %s", tableName))
		if err != nil {
			fmt.Printf("Failed to query rows: %v\n", err)
			continue
		}

		// Get column names
		cols, err := rows.Columns()
		if err != nil {
			return fmt.Errorf("failed to get columns: %w", err)
		}

		// Print all rows
		vals := make([]interface{}, len(cols))
		ptrs := make([]interface{}, len(cols))

		for i := range vals {
			ptrs[i] = &vals[i]
		}

		for rows.Next() {
			rows.Scan(ptrs...)
			for i, col := range cols {
				fmt.Printf("%s: %v\t", col, vals[i])
			}
			fmt.Println()
		}
		rows.Close()
	}

	return nil
}
