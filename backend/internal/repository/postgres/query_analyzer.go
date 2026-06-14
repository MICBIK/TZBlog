package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

// QueryAnalyzer provides tools for analyzing query performance
type QueryAnalyzer struct {
	db *gorm.DB
}

// NewQueryAnalyzer creates a new query analyzer
func NewQueryAnalyzer(db *gorm.DB) *QueryAnalyzer {
	return &QueryAnalyzer{db: db}
}

// ExplainResult represents the result of EXPLAIN ANALYZE
type ExplainResult struct {
	Query         string
	ExecutionTime time.Duration
	PlanningTime  time.Duration
	Plan          []string
	Warnings      []string
}

// AnalyzeQuery runs EXPLAIN ANALYZE on a query and returns the result
func (qa *QueryAnalyzer) AnalyzeQuery(ctx context.Context, query string, args ...interface{}) (*ExplainResult, error) {
	// Build EXPLAIN ANALYZE query
	explainQuery := fmt.Sprintf("EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) %s", query)

	// Execute EXPLAIN
	rows, err := qa.db.WithContext(ctx).Raw(explainQuery, args...).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to execute EXPLAIN: %w", err)
	}
	defer rows.Close()

	result := &ExplainResult{
		Query: query,
		Plan:  make([]string, 0),
	}

	// Parse EXPLAIN output
	for rows.Next() {
		var line string
		if err := rows.Scan(&line); err != nil {
			return nil, err
		}
		result.Plan = append(result.Plan, line)

		// Extract execution time
		if strings.Contains(line, "Execution Time:") {
			fmt.Sscanf(line, " Execution Time: %f ms", &result.ExecutionTime)
			result.ExecutionTime *= time.Millisecond
		}

		// Extract planning time
		if strings.Contains(line, "Planning Time:") {
			fmt.Sscanf(line, " Planning Time: %f ms", &result.PlanningTime)
			result.PlanningTime *= time.Millisecond
		}
	}

	// Analyze for common performance issues
	result.Warnings = qa.detectWarnings(result.Plan)

	return result, nil
}

// detectWarnings analyzes the query plan for performance issues
func (qa *QueryAnalyzer) detectWarnings(plan []string) []string {
	warnings := make([]string, 0)
	planText := strings.Join(plan, "\n")

	// Check for sequential scans
	if strings.Contains(planText, "Seq Scan") {
		warnings = append(warnings, "Sequential scan detected - consider adding an index")
	}

	// Check for missing indexes
	if strings.Contains(planText, "Filter:") && strings.Contains(planText, "Seq Scan") {
		warnings = append(warnings, "Filter on sequential scan - index might help")
	}

	// Check for nested loops with high row counts
	if strings.Contains(planText, "Nested Loop") {
		for _, line := range plan {
			if strings.Contains(line, "Nested Loop") && strings.Contains(line, "rows=") {
				var rows int
				fmt.Sscanf(line, "%*s rows=%d", &rows)
				if rows > 1000 {
					warnings = append(warnings, fmt.Sprintf("Nested loop with high row count (%d) - consider hash join", rows))
					break
				}
			}
		}
	}

	// Check for sorts without indexes
	if strings.Contains(planText, "Sort") && !strings.Contains(planText, "Index Scan") {
		warnings = append(warnings, "Sort operation without index - consider adding index on ORDER BY columns")
	}

	// Check for temp files (memory overflow)
	if strings.Contains(planText, "disk:") {
		warnings = append(warnings, "Query using disk temp files - increase work_mem or optimize query")
	}

	return warnings
}

// AnalyzeSlowQueries finds and analyzes slow queries from pg_stat_statements
func (qa *QueryAnalyzer) AnalyzeSlowQueries(ctx context.Context, minDuration time.Duration, limit int) ([]SlowQuery, error) {
	query := `
		SELECT
			query,
			calls,
			total_exec_time,
			mean_exec_time,
			max_exec_time,
			stddev_exec_time,
			rows
		FROM pg_stat_statements
		WHERE mean_exec_time > $1
		ORDER BY mean_exec_time DESC
		LIMIT $2
	`

	rows, err := qa.db.WithContext(ctx).Raw(query, minDuration.Milliseconds(), limit).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to query pg_stat_statements: %w", err)
	}
	defer rows.Close()

	slowQueries := make([]SlowQuery, 0)
	for rows.Next() {
		var sq SlowQuery
		if err := rows.Scan(
			&sq.Query,
			&sq.Calls,
			&sq.TotalExecTime,
			&sq.MeanExecTime,
			&sq.MaxExecTime,
			&sq.StddevExecTime,
			&sq.Rows,
		); err != nil {
			return nil, err
		}
		slowQueries = append(slowQueries, sq)
	}

	return slowQueries, nil
}

// SlowQuery represents a slow query from pg_stat_statements
type SlowQuery struct {
	Query          string
	Calls          int64
	TotalExecTime  float64
	MeanExecTime   float64
	MaxExecTime    float64
	StddevExecTime float64
	Rows           int64
}

// CheckIndexUsage returns index usage statistics
func (qa *QueryAnalyzer) CheckIndexUsage(ctx context.Context) ([]IndexUsage, error) {
	query := `
		SELECT
			schemaname,
			tablename,
			indexname,
			idx_scan,
			idx_tup_read,
			idx_tup_fetch
		FROM pg_stat_user_indexes
		ORDER BY idx_scan DESC
	`

	rows, err := qa.db.WithContext(ctx).Raw(query).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to query index usage: %w", err)
	}
	defer rows.Close()

	indexUsage := make([]IndexUsage, 0)
	for rows.Next() {
		var iu IndexUsage
		if err := rows.Scan(
			&iu.SchemaName,
			&iu.TableName,
			&iu.IndexName,
			&iu.IndexScans,
			&iu.TuplesRead,
			&iu.TuplesFetch,
		); err != nil {
			return nil, err
		}
		indexUsage = append(indexUsage, iu)
	}

	return indexUsage, nil
}

// IndexUsage represents index usage statistics
type IndexUsage struct {
	SchemaName  string
	TableName   string
	IndexName   string
	IndexScans  int64
	TuplesRead  int64
	TuplesFetch int64
}

// FindUnusedIndexes finds indexes that are never used
func (qa *QueryAnalyzer) FindUnusedIndexes(ctx context.Context) ([]string, error) {
	query := `
		SELECT
			schemaname || '.' || indexname as index_name
		FROM pg_stat_user_indexes
		WHERE idx_scan = 0
		AND indexname NOT LIKE '%_pkey'
		ORDER BY indexname
	`

	rows, err := qa.db.WithContext(ctx).Raw(query).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to find unused indexes: %w", err)
	}
	defer rows.Close()

	unused := make([]string, 0)
	for rows.Next() {
		var indexName string
		if err := rows.Scan(&indexName); err != nil {
			return nil, err
		}
		unused = append(unused, indexName)
	}

	return unused, nil
}

// GetTableStats returns table statistics
func (qa *QueryAnalyzer) GetTableStats(ctx context.Context) ([]TableStats, error) {
	query := `
		SELECT
			schemaname,
			tablename,
			seq_scan,
			seq_tup_read,
			idx_scan,
			idx_tup_fetch,
			n_tup_ins,
			n_tup_upd,
			n_tup_del
		FROM pg_stat_user_tables
		ORDER BY seq_scan DESC
	`

	rows, err := qa.db.WithContext(ctx).Raw(query).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to query table stats: %w", err)
	}
	defer rows.Close()

	stats := make([]TableStats, 0)
	for rows.Next() {
		var ts TableStats
		var idxScan, idxTupFetch *int64
		if err := rows.Scan(
			&ts.SchemaName,
			&ts.TableName,
			&ts.SeqScan,
			&ts.SeqTupRead,
			&idxScan,
			&idxTupFetch,
			&ts.TupInserted,
			&ts.TupUpdated,
			&ts.TupDeleted,
		); err != nil {
			return nil, err
		}
		if idxScan != nil {
			ts.IdxScan = *idxScan
		}
		if idxTupFetch != nil {
			ts.IdxTupFetch = *idxTupFetch
		}
		stats = append(stats, ts)
	}

	return stats, nil
}

// TableStats represents table statistics
type TableStats struct {
	SchemaName   string
	TableName    string
	SeqScan      int64
	SeqTupRead   int64
	IdxScan      int64
	IdxTupFetch  int64
	TupInserted  int64
	TupUpdated   int64
	TupDeleted   int64
}

// GetConnectionPoolStats returns connection pool statistics
func (qa *QueryAnalyzer) GetConnectionPoolStats() (*PoolStats, error) {
	sqlDB, err := qa.db.DB()
	if err != nil {
		return nil, err
	}

	stats := sqlDB.Stats()
	return &PoolStats{
		MaxOpenConnections: stats.MaxOpenConnections,
		OpenConnections:    stats.OpenConnections,
		InUse:              stats.InUse,
		Idle:               stats.Idle,
		WaitCount:          stats.WaitCount,
		WaitDuration:       stats.WaitDuration,
		MaxIdleClosed:      stats.MaxIdleClosed,
		MaxLifetimeClosed:  stats.MaxLifetimeClosed,
	}, nil
}

// PoolStats represents connection pool statistics
type PoolStats struct {
	MaxOpenConnections int
	OpenConnections    int
	InUse              int
	Idle               int
	WaitCount          int64
	WaitDuration       time.Duration
	MaxIdleClosed      int64
	MaxLifetimeClosed  int64
}
