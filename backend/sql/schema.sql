-- MySQL schema for LocalNotes
-- In production, prefer migrations; this is a portable reference schema.

CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  tags TEXT NOT NULL,
  updatedAt VARCHAR(30) NOT NULL,
  isDeleted TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);
