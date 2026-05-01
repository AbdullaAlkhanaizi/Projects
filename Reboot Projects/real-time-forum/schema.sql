-- schema.sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- ========================
-- Users & Auth
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,      -- UUID string
  nickname      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  age           INTEGER NOT NULL CHECK(age >= 13),
  gender        TEXT NOT NULL,         -- free text or ('male','female','other','prefer_not_to_say')
  password_hash TEXT NOT NULL,         -- bcrypt
  created_at    INTEGER NOT NULL,      -- unix seconds
  last_seen_at  INTEGER                -- for presence (optional)
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,        -- UUID
  user_id     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ========================
-- Categories / Posts / Comments
-- ========================
CREATE TABLE IF NOT EXISTS categories (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS posts (
  id          TEXT PRIMARY KEY,        -- UUID
  author_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

CREATE TABLE IF NOT EXISTS post_categories (
  post_id     TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,        -- UUID
  post_id     TEXT NOT NULL,
  author_id   TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post_time ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

-- ========================
-- Direct Messages (1-to-1)
-- ========================
-- Model each private chat as a "conversation" between two users.
CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,       -- UUID
  user1_id   TEXT NOT NULL,
  user2_id   TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK (user1_id <> user2_id),
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enforce one conversation per unordered pair (user1,user2)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_conversation_pair
ON conversations(
  CASE WHEN user1_id < user2_id THEN user1_id ELSE user2_id END,
  CASE WHEN user1_id < user2_id THEN user2_id ELSE user1_id END
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,      -- UUID
  conversation_id TEXT NOT NULL,
  sender_id       TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  edited_at       INTEGER,               -- nullable
  deleted_at      INTEGER,               -- soft delete (nullable)
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_time
ON messages(conversation_id, created_at DESC);

-- Track per-user read state (optional but useful)
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  last_read_msg_id TEXT,                 -- nullable
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (last_read_msg_id) REFERENCES messages(id)     ON DELETE SET NULL
);

-- ========================
-- Helper views for ordering DMs
-- ========================
-- Last message per conversation (for ordering the sidebar like Discord)
CREATE VIEW IF NOT EXISTS v_conversation_last AS
SELECT
  m.conversation_id,
  m.id            AS last_message_id,
  m.created_at    AS last_message_at
FROM messages m
JOIN (
  SELECT conversation_id, MAX(created_at) AS max_created
  FROM messages
  GROUP BY conversation_id
) t
ON t.conversation_id = m.conversation_id AND t.max_created = m.created_at;

-- ========================
-- Seeds (optional)
-- ========================
INSERT OR IGNORE INTO categories(name) VALUES
('general'), ('announcements'), ('tech'), ('random');
