package model

// AdminSetting stores key-value settings (currently: admin_password hash)
type AdminSetting struct {
	Key   string `gorm:"primaryKey;size:64" json:"key"`
	Value string `gorm:"type:text"          json:"-"`
}

func (AdminSetting) TableName() string {
	return "admin_settings"
}
