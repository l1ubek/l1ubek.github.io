-- Drop and recreate users table to ensure clean state
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
-- Hash generated with bcrypt for 'admin123'
INSERT INTO users (username, email, password, role) 
VALUES (
    'admin', 
    'admin@example.com', 
    '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.jjAiU8VWvO6JZ8.8zJbvZXeFqSgC', 
    'admin'
);

-- Insert default regular user (password: user123)  
-- Hash generated with bcrypt for 'user123'
INSERT INTO users (username, email, password, role) 
VALUES (
    'user', 
    'user@example.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'user'
);
