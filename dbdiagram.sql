CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- user, admin, power_admin
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE
);

CREATE TABLE controls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE
);

CREATE TABLE user_controls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    control_id INTEGER REFERENCES controls(id) ON DELETE CASCADE,
    UNIQUE(user_id, control_id)
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- напр. 'login', 'register', 'control_press', 'admin_entry'
    control_id INTEGER REFERENCES controls(id), -- nullable, само за някои типове
    details TEXT, -- JSON or free text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
