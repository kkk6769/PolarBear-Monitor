package model

import "time"

// Server 存储在数据库中的服务器记录
type Server struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID         string    `gorm:"uniqueIndex;size:36"      json:"uuid"`
	Name         string    `gorm:"size:100"                 json:"name"`
	DisplayIndex int       `gorm:"default:0"                json:"display_index"`
	Note         string    `gorm:"size:500"                 json:"note"`
	Secret       string    `gorm:"size:128"                 json:"-"`
	Host         string    `gorm:"type:text"                json:"host"`
	State        string    `gorm:"type:text"                json:"state"`
	IP           string    `gorm:"size:45"                  json:"ip"`
	Online       bool      `gorm:"default:false"            json:"online"`
	LastActive   time.Time                                 `json:"last_active"`
	CreatedAt    time.Time                                 `json:"created_at"`
	UpdatedAt    time.Time                                 `json:"updated_at"`
}

func (Server) TableName() string {
	return "servers"
}
