package model

import "fmt"

// FormatBytes converts bytes to human-readable string (e.g., "1.5 GB")
func FormatBytes(b uint64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := uint64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

// FormatBytesPerSec converts bytes/sec to human-readable string (e.g., "3.2 MB/s")
func FormatBytesPerSec(b uint64) string {
	return FormatBytes(b) + "/s"
}

// FormatUptime converts seconds to human-readable string (e.g., "3d 12h")
func FormatUptime(sec uint64) string {
	if sec < 60 {
		return fmt.Sprintf("%ds", sec)
	}
	if sec < 3600 {
		return fmt.Sprintf("%dm", sec/60)
	}
	days := sec / 86400
	hours := (sec % 86400) / 3600
	if days > 0 {
		return fmt.Sprintf("%dd %dh", days, hours)
	}
	return fmt.Sprintf("%dh %dm", sec/3600, (sec%3600)/60)
}
