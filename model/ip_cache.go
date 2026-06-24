package model

import "time"

// IPCache stores IP geolocation results with expiry
type IPCache struct {
	IP          string    `gorm:"primaryKey;size:45" json:"ip"`
	Country     string    `gorm:"size:100"           json:"country"`
	CountryCode string    `gorm:"size:4"             json:"country_code"`
	UpdatedAt   time.Time                           `json:"updated_at"`
}

func (IPCache) TableName() string {
	return "ip_cache"
}
