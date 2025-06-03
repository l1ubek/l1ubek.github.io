-- Create chat tables
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'group' CHECK (type IN ('private', 'group')),
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

-- Insert default general chat room
INSERT INTO chat_rooms (name, type, created_by) 
SELECT 'Загальний чат', 'group', 1
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'Загальний чат');

-- Add all existing users to general chat
INSERT INTO chat_participants (room_id, user_id)
SELECT 
    (SELECT id FROM chat_rooms WHERE name = 'Загальний чат' LIMIT 1),
    u.id
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.room_id = (SELECT id FROM chat_rooms WHERE name = 'Загальний чат' LIMIT 1)
    AND cp.user_id = u.id
);
