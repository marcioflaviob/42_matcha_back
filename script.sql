CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	first_name VARCHAR(255) NOT NULL,
	last_name VARCHAR(255) NOT NULL,
	birthdate DATE NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	status VARCHAR(255) NOT NULL,
	gender VARCHAR(255),
	sexual_interest VARCHAR(255),
	biography TEXT,
	location VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS interests (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_interests (
	user_id INT NOT NULL,
	interest_id INT NOT NULL,
	PRIMARY KEY (user_id, interest_id),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_pictures (
	id SERIAL PRIMARY KEY,
	user_id INT NOT NULL,
	url VARCHAR(255) NOT NULL,
	is_profile BOOLEAN DEFAULT FALSE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_interactions (
	user1 INT NOT NULL,
	user2 INT NOT NULL,
	interaction_type VARCHAR(255) NOT NULL,
	interaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user1, user2, interaction_type),
	FOREIGN KEY (user1) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (user2) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
	id SERIAL PRIMARY KEY,
	user_id INT NOT NULL,
	type VARCHAR(255) NOT NULL,
	title VARCHAR(255),
	message VARCHAR(255),
	seen BOOLEAN DEFAULT FALSE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
	id SERIAL PRIMARY KEY,
	sender_id INT NOT NULL,
	receiver_id INT NOT NULL,
	content TEXT NOT NULL,
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

ALTER TABLE interests DISABLE ROW LEVEL SECURITY;

ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

ALTER TABLE user_pictures DISABLE ROW LEVEL SECURITY;

ALTER TABLE user_interactions DISABLE ROW LEVEL SECURITY;

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

INSERT INTO interests (name) VALUES
('Sports'),
('Music'),
('Books'),
('Food'),
('Fashion'),
('Travel'),
('Photography'),
('Gaming'),
('Art'),
('Technology'),
('Fitness'),
('Politics'),
('Pets'),
('Nature'),
('Cinema'),
('Cooking'),
('Dance'),
('Writing'),
('Vegan'),
('Geek'),
('Piercing');