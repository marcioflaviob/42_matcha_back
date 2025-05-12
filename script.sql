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
	rating INT DEFAULT 10,
	min_desired_rating INT DEFAULT 0,
	age_range_min INT DEFAULT 0,
	age_range_max INT DEFAULT 100
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
	is_read BOOLEAN DEFAULT FALSE,
	FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS location (
    user_id INT PRIMARY KEY,
    longitude DECIMAL(11, 7) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    city VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

-- Insert mock users
-- Password: 1234
INSERT INTO users (id, first_name, last_name, birthdate, email, password, status, gender, sexual_interest, biography, rating)
VALUES
(10001, 'Tony', 'Stark', '1970-05-29', 'tony.stark@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Genius billionaire playboy philanthropist.', 7),
(10002, 'Diana', 'Prince', '1985-03-22', 'diana.prince@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Amazon warrior and protector of peace.', 8),
(10003, 'Bruce', 'Wayne', '1972-02-19', 'bruce.wayne@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Gotham’s dark knight and philanthropist.', 9),
(10004, 'Hermione', 'Granger', '1989-09-19', 'hermione.granger@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Brightest witch of her age and advocate for elf rights.', 10),
(10006, 'Oprah', 'Winfrey', '1954-01-29', 'oprah.winfrey@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Any', 'Media mogul and philanthropist inspiring millions.', 8),
(10007, 'Harley', 'Quinn', '1990-07-20', 'harley.quinn@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Psychiatrist turned anti-hero with a love for chaos.', 6),
(10008, 'Luke', 'Skywalker', '1981-09-25', 'luke.skywalker@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Jedi knight fighting for peace in the galaxy.', 7),
(10009, 'Lara', 'Croft', '1988-02-14', 'lara.croft@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Adventurer and archaeologist exploring the unknown.', 8),
(10010, 'David', 'Bowie', '1947-01-08', 'david.bowie@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Any', 'Iconic musician and artist redefining creativity.', 4),
(20001, 'Homer', 'Simpson', '1956-05-12', 'homer.simpson@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Lover of donuts, beer, and family.', 5),
(20002, 'Marge', 'Simpson', '1958-03-19', 'marge.simpson@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'The glue that holds the Simpson family together.', 6),
(20003, 'Bart', 'Simpson', '1980-04-01', 'bart.simpson@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Mischievous troublemaker with a heart of gold.', 5),
(20004, 'Lisa', 'Simpson', '1982-05-09', 'lisa.simpson@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Intelligent and passionate about music and activism.', 7),
(20005, 'SpongeBob', 'SquarePants', '1986-07-14', 'spongebob.squarepants@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Any', 'Optimistic sponge who loves jellyfishing and flipping Krabby Patties.', 6),
(20006, 'Patrick', 'Star', '1986-08-17', 'patrick.star@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Any', 'SpongeBob’s best friend and lover of simple pleasures.', 5),
(20007, 'Scooby', 'Doo', '1979-09-13', 'scooby.doo@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Any', 'Mystery-solving dog with a love for Scooby Snacks.', 6),
(20008, 'Velma', 'Dinkley', '1980-12-15', 'velma.dinkley@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'The brains of the Mystery Inc. gang.', 7),
(20009, 'Fred', 'Jones', '1978-11-10', 'fred.jones@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Leader of Mystery Inc. and trap enthusiast.', 6),
(20010, 'Shaggy', 'Rogers', '1979-01-21', 'shaggy.rogers@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Laid-back guy with a big appetite and a knack for solving mysteries.', 8),
(30001, 'Taylor', 'Swift', '1989-12-13', 'taylor.swift@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Singer-songwriter known for her storytelling through music.', 8),
(30002, 'Justin', 'Bieber', '1994-03-01', 'justin.bieber@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Pop sensation and global superstar.', 7),
(30003, 'Billie', 'Eilish', '2001-12-18', 'billie.eilish@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Any', 'Grammy-winning artist with a unique style and voice.', 10),
(30004, 'Shawn', 'Mendes', '1998-08-08', 'shawn.mendes@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Singer-songwriter with a passion for heartfelt music.', 9),
(30005, 'Ariana', 'Grande', '1993-06-26', 'ariana.grande@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Pop icon with a powerful voice and a love for animals.', 8),
(30006, 'Benny', 'Blanco', '1992-07-22', 'benny.blanco@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Any', 'Composer, singer, and hottest men of the year.', 10),
(30007, 'Harry', 'Styles', '1994-02-01', 'harry.styles@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Any', 'Singer and fashion icon redefining pop culture.', 9),
(30008, 'Zendaya', 'Coleman', '1996-09-01', 'zendaya.coleman@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Actress, singer, and advocate for diversity in Hollywood.', 8),
(30009, 'Olivia', 'Rodrigo', '2003-02-20', 'olivia.rodrigo@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Female', 'Male', 'Singer-songwriter capturing the emotions of a generation.', 9),
(30010, 'Charlie', 'Puth', '1991-12-02', 'charlie.puth@gmail.com', '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO', 'complete', 'Male', 'Female', 'Singer-songwriter and producer with perfect pitch.', 10);

INSERT INTO user_pictures (user_id, url, is_profile)
VALUES
(10001, 'celeb/tony_stark-y3mb9ujAuOtnL5mQzEIYYBDmF8YfPk.jpg', TRUE),
(10002, 'celeb/diana_prince-xB11HbDg5EsLn83OdiJ8sha9N6ismQ.jpg', TRUE),
(10003, 'celeb/bruce_wayne-Vx6t4lL6iibqs2mIMgUeJuiXagxXrJ.jpg', TRUE),
(10004, 'celeb/hermione_granger-IWOlccshoU5AYRnXaE8AXD4juOoSUO.jpg', TRUE),
(10006, 'celeb/oprah_winfrey-BZ8xCdEgWOtExWBp3n1dQha0QvjpF2.jpg', TRUE),
(10007, 'celeb/harley_quinn-iCGz5lltV5Ueis3fev64VfycEqn2fZ.jpg', TRUE),
(10008, 'celeb/luke_skywalker-KkTtju5OzJVd8h4ZmDJYc6wEbIsLjE.jpg', TRUE),
(10009, 'celeb/lara_croft-2Nki9WQQVV6uEhynroXR9qEOHvqZTi.jpg', TRUE),
(10010, 'celeb/david_bowie-PTGu9p90ctPppApuqsAv0e7eA6rJnG.jpg', TRUE),
(20001, 'celeb/homer_simpson-1I6PsxOGynRpzFH4CkwiEqISWi9Qdm.jpg', TRUE),
(20002, 'celeb/marge_simpson-7YWcWcjvwvr71ZZ6pvMHKTgXtBSRbE.jpg', TRUE),
(20003, 'celeb/bart_simpson-N5ji6FDd8ITczJ9vuSV0k43KGnAP9w.jpg', TRUE),
(20004, 'celeb/lisa_simpson-jsMEMJXlU8Uf6cvx2IfwJpfMtolxkT.jpg', TRUE),
(20005, 'celeb/spongebob_squarepants-HO2FCqgCPnBCCmD2UvilzlyOK33pA3.jpg', TRUE),
(20006, 'celeb/patrick_star-FF8rQSjIk1dUQtueiTaC59zS78VUya.jpg', TRUE),
(20007, 'celeb/scooby_doo-SdKuZICHL0VQhcF0N3OYy2sKiehd9I.jpg', TRUE),
(20008, 'celeb/velma_dinkley-XNbcsV7C3HftLYied0Rb0wkti9eE8n.jpg', TRUE),
(20009, 'celeb/fred_jones-kU9HLVYipLFYmEWzHK61iSS24YSLLG.jpg', TRUE),
(20010, 'celeb/shaggy_rogers-4CK0Q6p70aJplVGfGONKsYllD7oAa8.jpg', TRUE),
(30001, 'celeb/taylor_swift-5B0F0mCsEtmLTlhZYuJydCMYyQnRLB.jpg', TRUE),
(30002, 'celeb/justin_bieber-TURH894u5aysvKqJRDZ4hX2oZiHJQE.jpg', TRUE),
(30003, 'celeb/billie_eilish-lqCI17cyAWINTTbs1Q4zJpkcpT7Bvs.jpg', TRUE),
(30004, 'celeb/shawn_mendes-tBX7hIk3cmBj8Xo5TREEjIfQ1SspPh.jpg', TRUE),
(30005, 'celeb/ariana_grande-aggdWK8n65g6KOwRMZ0ffFHdhDLqob.jpg', TRUE),
(30006, 'celeb/benny_blanco-KXSzeycYlysWkhiN0vfbxkbQzpvVtV.jpg', TRUE),
(30007, 'celeb/harry_styles-W0Cc9fYhTRpIHuJrwk7zwDvUrdJ1JF.jpg', TRUE),
(30008, 'celeb/zendaya_coleman-J49bXwECJVpDsLs8L7aWnoYq8XBwfM.jpg', TRUE),
(30009, 'celeb/olivia_rodrigo-dyg3podOlz36WQuFHtl8O4ChgGouiK.jpg', TRUE),
(30010, 'celeb/charlie_puth-jCnlXGIeOSOF4WLQcPKFHx0Sws9Rao.jpg', TRUE);

INSERT INTO location (user_id, longitude, latitude, city, country) VALUES
-- Superheroes and Characters
(10001, 2.3522, 48.8566, 'Paris', 'France'),                    -- Tony Stark (8th arrondissement)
(10002, 2.2945, 48.8584, 'Paris', 'France'),                    -- Diana Prince (16th arrondissement)
(10003, 2.3488, 48.8534, 'Paris', 'France'),                    -- Bruce Wayne (5th arrondissement)
(10004, 2.3912, 48.8649, 'Paris', 'France'),                    -- Hermione Granger (19th arrondissement)
(10006, 2.3654, 48.8744, 'Paris', 'France'),                    -- Oprah Winfrey (20th arrondissement)
(10007, 2.2945, 48.8737, 'Paris', 'France'),                    -- Harley Quinn (17th arrondissement)
(10008, 2.3585, 48.8699, 'Paris', 'France'),                    -- Luke Skywalker (10th arrondissement)
(10009, 2.3333, 48.8667, 'Paris', 'France'),                    -- Lara Croft (9th arrondissement)
(10010, 2.3470, 48.8597, 'Paris', 'France'),                    -- David Bowie (4th arrondissement)

-- Simpsons Characters
(20001, 2.2399, 48.8965, 'Neuilly-sur-Seine', 'France'),        -- Homer Simpson
(20002, 2.2855, 48.9097, 'Levallois-Perret', 'France'),         -- Marge Simpson
(20003, 2.2769, 48.8937, 'Clichy', 'France'),                   -- Bart Simpson
(20004, 2.4264, 48.9134, 'Bobigny', 'France'),                  -- Lisa Simpson
(20005, 2.4680, 48.8938, 'Montreuil', 'France'),                -- SpongeBob
(20006, 2.4449, 48.8815, 'Bagnolet', 'France'),                 -- Patrick Star
(20007, 2.2529, 48.8937, 'Courbevoie', 'France'),               -- Scooby Doo
(20008, 2.3047, 48.9177, 'Saint-Denis', 'France'),              -- Velma Dinkley
(20009, 2.2195, 48.8915, 'Puteaux', 'France'),                  -- Fred Jones
(20010, 2.2870, 48.9234, 'Saint-Ouen', 'France'),               -- Shaggy Rogers

-- Musicians and Celebrities
(30001, 2.2974, 48.8331, 'Issy-les-Moulineaux', 'France'),      -- Taylor Swift
(30002, 2.3265, 48.8131, 'Montrouge', 'France'),                -- Justin Bieber
(30003, 2.2922, 48.8228, 'Vanves', 'France'),                   -- Billie Eilish
(30004, 2.2793, 48.7955, 'Clamart', 'France'),                  -- Shawn Mendes
(30005, 2.4635, 48.8404, 'Vincennes', 'France'),                -- Ariana Grande
(30006, 2.4163, 48.8144, 'Charenton-le-Pont', 'France'),        -- Benny Blanco
(30007, 2.4079, 48.8302, 'Saint-Mandé', 'France'),              -- Harry Styles
(30008, 2.3071, 48.9001, 'Saint-Ouen', 'France'),               -- Zendaya Coleman
(30009, 2.3654, 48.9162, 'Aubervilliers', 'France'),            -- Olivia Rodrigo
(30010, 2.4243, 48.9358, 'Le Bourget', 'France');               -- Charlie Puth

-- Insert mock user interests
INSERT INTO user_interests (user_id, interest_id)
VALUES
-- Tony Stark
(10001, 3), -- Books
(10001, 6), -- Travel
(10001, 10), -- Technology
(10001, 11), -- Fitness
(10001, 15), -- Cinema

-- Diana Prince
(10002, 1), -- Sports
(10002, 11), -- Fitness
(10002, 13), -- Pets
(10002, 14), -- Nature
(10002, 15), -- Cinema

-- Bruce Wayne
(10003, 1), -- Sports
(10003, 3), -- Books
(10003, 10), -- Technology
(10003, 11), -- Fitness
(10003, 15), -- Cinema

-- Hermione Granger
(10004, 3), -- Books
(10004, 9), -- Art
(10004, 12), -- Politics
(10004, 16), -- Cooking
(10004, 18), -- Writing

-- Oprah Winfrey
(10006, 3), -- Books
(10006, 4), -- Food
(10006, 9), -- Art
(10006, 16), -- Cooking
(10006, 18), -- Writing

-- Harley Quinn
(10007, 8), -- Gaming
(10007, 9), -- Art
(10007, 13), -- Pets
(10007, 15), -- Cinema
(10007, 21), -- Piercing

-- Luke Skywalker
(10008, 1), -- Sports
(10008, 6), -- Travel
(10008, 14), -- Nature
(10008, 15), -- Cinema
(10008, 20), -- Geek

-- Lara Croft
(10009, 1), -- Sports
(10009, 6), -- Travel
(10009, 14), -- Nature
(10009, 15), -- Cinema
(10009, 17), -- Dance

-- David Bowie
(10010, 2), -- Music
(10010, 9), -- Art
(10010, 15), -- Cinema
(10010, 18), -- Writing
(10010, 19), -- Vegan

-- Homer Simpson
(20001, 4), -- Food
(20001, 15), -- Cinema
(20001, 13), -- Pets

-- Marge Simpson
(20002, 16), -- Cooking
(20002, 3), -- Books
(20002, 9), -- Art
(20002, 15), -- Cinema

-- Bart Simpson
(20003, 8), -- Gaming
(20003, 1), -- Sports
(20003, 15), -- Cinema
(20003, 21), -- Piercing

-- Lisa Simpson
(20004, 2), -- Music
(20004, 3), -- Books
(20004, 12), -- Politics
(20004, 9), -- Art
(20004, 18), -- Writing

-- SpongeBob SquarePants
(20005, 13), -- Pets
(20005, 14), -- Nature
(20005, 6), -- Travel
(20005, 15), -- Cinema

-- Patrick Star
(20006, 4), -- Food
(20006, 13), -- Pets
(20006, 15), -- Cinema
(20006, 6), -- Travel

-- Scooby Doo
(20007, 4), -- Food
(20007, 13), -- Pets
(20007, 15), -- Cinema
(20007, 6), -- Travel

-- Velma Dinkley
(20008, 3), -- Books
(20008, 9), -- Art
(20008, 12), -- Politics
(20008, 15), -- Cinema

-- Fred Jones
(20009, 1), -- Sports
(20009, 6), -- Travel
(20009, 15), -- Cinema
(20009, 14), -- Nature

-- Shaggy Rogers
(20010, 4), -- Food
(20010, 13), -- Pets
(20010, 6), -- Travel

-- Taylor Swift
(30001, 2), -- Music
(30001, 3), -- Books
(30001, 18), -- Writing
(30001, 15), -- Cinema
(30001, 9), -- Art

-- Justin Bieber
(30002, 2), -- Music
(30002, 6), -- Travel
(30002, 15), -- Cinema

-- Billie Eilish
(30003, 2), -- Music
(30003, 9), -- Art
(30003, 8), -- Gaming
(30003, 15), -- Cinema
(30003, 20), -- Geek

-- Shawn Mendes
(30004, 2), -- Music
(30004, 3), -- Books
(30004, 6), -- Travel
(30004, 15), -- Cinema
(30004, 11), -- Fitness

-- Ariana Grande
(30005, 2), -- Music
(30005, 13), -- Pets
(30005, 16), -- Cooking
(30005, 15), -- Cinema
(30005, 9), -- Art

-- Benny Blanco
(30006, 2), -- Music
(30006, 3), -- Books
(30006, 15), -- Cinema
(30006, 16), -- Cooking
(30006, 18), -- Writing

-- Harry Styles
(30007, 2), -- Music
(30007, 9), -- Art
(30007, 15), -- Cinema
(30007, 6), -- Travel
(30007, 5), -- Fashion

-- Zendaya Coleman
(30008, 2), -- Music
(30008, 9), -- Art
(30008, 15), -- Cinema
(30008, 6), -- Travel
(30008, 12), -- Politics

-- Olivia Rodrigo
(30009, 2), -- Music
(30009, 3), -- Books
(30009, 18), -- Writing
(30009, 15), -- Cinema
(30009, 9), -- Art

-- Charlie Puth
(30010, 2), -- Music
(30010, 10), -- Technology
(30010, 15), -- Cinema
(30010, 6), -- Travel
(30010, 18); -- Writing