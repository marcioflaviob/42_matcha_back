-- Generate 500 unique French users with sequential data and truly unique names
DO $$
DECLARE
    i INT;
    v_first_name VARCHAR(255);
    v_last_name VARCHAR(255);
    v_email VARCHAR(255);
    v_birthdate DATE;
    v_user_id INT;
    min_id INT := 50001; -- Explicitly set the starting ID

    -- Expanded French First Names List (approx 100 names)
    french_first_names TEXT[] := ARRAY[
        'Adrien', 'Amelie', 'Antoine', 'Aurélie', 'Baptiste', 'Camille', 'Clément', 'Coralie', 'Damien', 'Delphine',
        'Étienne', 'Émilie', 'Fabien', 'Fanny', 'Gael', 'Garance', 'Guillaume', 'Hélène', 'Hugo', 'Inès',
        'Julien', 'Juliette', 'Kévin', 'Laure', 'Léo', 'Léa', 'Louis', 'Louise', 'Lucas', 'Manon',
        'Marc', 'Margaux', 'Mathieu', 'Mélanie', 'Nicolas', 'Noémie', 'Olivier', 'Océane', 'Paul', 'Pauline',
        'Quentin', 'Romane', 'Samuel', 'Sarah', 'Simon', 'Sophie', 'Théo', 'Tina', 'Ulysse', 'Valentine',
        'Victor', 'Victoria', 'William', 'Xavier', 'Yann', 'Zoé', 'Alexandre', 'Alice', 'Arthur', 'Axelle',
        'Bastien', 'Blandine', 'Cécile', 'Cédric', 'Chloé', 'Christophe', 'Clara', 'David', 'Diane', 'Édouard',
        'Éloïse', 'Florian', 'François', 'Gabrielle', 'Hadrien', 'Isabelle', 'Jean', 'Jeanne', 'Jeremy', 'Joséphine',
        'Jules', 'Justine', 'Laurent', 'Lena', 'Maël', 'Marine', 'Martin', 'Mathilde', 'Maxime', 'Mélissa',
        'Nathan', 'Nicole', 'Oscar', 'Perrine', 'Pierre', 'Raphaël', 'Rémi', 'Salomé', 'Sébastien', 'Solène',
        'Thibault', 'Valentin', 'Virginie', 'Yanis', 'Anaïs', 'Axel', 'Benjamin', 'Caroline', 'Corentin', 'Éva'
    ];
    
    -- Expanded French Last Names List (approx 100 names)
    french_last_names TEXT[] := ARRAY[
        'Bernard', 'Dubois', 'Thomas', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Michel',
        'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Lefebvre', 'Faure', 'Andre', 'Guerin',
        'Lemaire', 'Poirier', 'Marchand', 'Duval', 'Hubert', 'Richard', 'Dupont', 'Henry', 'Roussel', 'Nicolas',
        'Meyer', 'Denis', 'Gautier', 'Clerc', 'Boulanger', 'Lejeune', 'Remy', 'Paris', 'Fleury', 'Blanchard',
        'Roger', 'Fontaine', 'Garnier', 'Jacquet', 'Girard', 'Barbier', 'Robin', 'Masson', 'Morin', 'Lambert',
        'Dupuis', 'Legrand', 'Brun', 'Martin', 'Leclerc', 'Carpentier', 'Allard', 'Colin', 'Noël', 'Perrot',
        'Olivier', 'Picard', 'Lacroix', 'Le Gall', 'Perrier', 'Leblanc', 'Schneider', 'Louis', 'Arnould', 'Marcel',
        'Caron', 'Philippe', 'Hamon', 'Delattre', 'Maillard', 'Reynaud', 'Rey', 'Dumont', 'Bourgeois', 'Vasseur',
        'Boyer', 'Goncalves', 'Cousin', 'Bertin', 'Riviere', 'Lucas', 'Lebrun', 'Marie', 'Pons', 'Brunel',
        'Charles', 'Lemoine', 'Prevost', 'Morel', 'Daniel', 'Renard', 'Schmitt', 'Muller', 'Leroux', 'Robert'
    ];

    -- Base values for consistent data
    base_password VARCHAR(255) := '$2b$10$z3lfua/3GIBnBi1lSTlEjus5diHWfzOF3kBQ6uMIpREbWxcnMzHJO'; -- Hashed '1234'
    base_status VARCHAR(255) := 'complete';
    base_gender VARCHAR(255); -- Will alternate Male/Female
    base_sexual_interest VARCHAR(255); -- Will alternate Female/Male
    base_biography TEXT := 'Utilisateur généré pour les tests de l''application de rencontre.';
    base_rating INT := 7;
    base_min_desired_rating INT := 0;
    base_age_range_min INT := 0;
    base_age_range_max INT := 100;

    -- Location data (cycling through the provided real Paris-area coordinates)
    cities_for_new_users TEXT[] := ARRAY[
        'Paris', 'Neuilly-sur-Seine', 'Levallois-Perret', 'Clichy', 'Bobigny',
        'Montreuil', 'Bagnolet', 'Courbevoie', 'Saint-Denis', 'Puteaux',
        'Saint-Ouen', 'Issy-les-Moulineaux', 'Montrouge', 'Vanves', 'Clamart',
        'Vincennes', 'Charenton-le-Pont', 'Saint-Mandé', 'Aubervilliers', 'Le Bourget'
    ];
    
    longitudes_for_new_users DECIMAL(11, 7)[] := ARRAY[
        2.3522, 2.2399, 2.2855, 2.2769, 2.4264,
        2.4680, 2.4449, 2.2529, 2.3047, 2.2195,
        2.2870, 2.2974, 2.3265, 2.2922, 2.2793,
        2.4635, 2.4163, 2.4079, 2.3654, 2.4243
    ];

    latitudes_for_new_users DECIMAL(10, 7)[] := ARRAY[
        48.8566, 48.8965, 48.9097, 48.8937, 48.9134,
        48.8938, 48.8815, 48.8937, 48.9177, 48.8915,
        48.9234, 48.8331, 48.8131, 48.8228, 48.7955,
        48.8404, 48.8144, 48.8302, 48.9162, 48.9358
    ];

    interest_ids INT[];
    num_total_interests INT;

BEGIN
    -- Get all available interest IDs once, ordered for non-random assignment
    SELECT ARRAY(SELECT id FROM interests ORDER BY id) INTO interest_ids;
    num_total_interests := array_length(interest_ids, 1);

    FOR i IN 0..499 LOOP -- Loop from 0 to 499 to generate 500 users
        -- Calculate the user ID for this iteration
        v_user_id := min_id + i;

        -- Generate unique first and last names by cycling through the expanded lists
        -- No numbers appended to the name itself
        v_first_name := french_first_names[(i % array_length(french_first_names, 1)::int) + 1];
        v_last_name := french_last_names[(FLOOR(i / array_length(french_first_names, 1)::float)::int % array_length(french_last_names, 1)::int) + 1];
        
        -- Ensure email is unique by appending the user ID if the name combination isn't unique enough for email
        v_email := lower(REPLACE(v_first_name, ' ', '') || '.' || REPLACE(v_last_name, ' ', '') || v_user_id || '@example.com');
        
        -- Birthdate increments for uniqueness and age variation (between approx. 18 and 48 years old relative to a fixed start)
        v_birthdate := '1975-01-01'::DATE + (i * '30 days'::interval); 

        -- Alternate gender and sexual interest
        IF i % 2 = 0 THEN -- Starting with Male for 50001
            base_gender := 'Male';
            base_sexual_interest := 'Female';
        ELSE
            base_gender := 'Female';
            base_sexual_interest := 'Male';
        END IF;

        -- Insert user
        INSERT INTO users (id, first_name, last_name, birthdate, email, password, status, gender, sexual_interest, biography, rating, min_desired_rating, age_range_min, age_range_max)
        VALUES (v_user_id, v_first_name, v_last_name, v_birthdate, v_email, base_password, base_status, base_gender, base_sexual_interest, base_biography, base_rating, base_min_desired_rating, base_age_range_min, base_age_range_max)
        ON CONFLICT (id) DO NOTHING; -- In case of pre-existing IDs, skip
        
        -- Insert location data for the new user, cycling through provided locations
        INSERT INTO location (user_id, longitude, latitude, city, country)
        VALUES (v_user_id, longitudes_for_new_users[(i % array_length(longitudes_for_new_users, 1)::int) + 1], latitudes_for_new_users[(i % array_length(latitudes_for_new_users, 1)::int) + 1], cities_for_new_users[(i % array_length(cities_for_new_users, 1)::int) + 1], 'France')
        ON CONFLICT (user_id) DO UPDATE SET -- Update if user_id already exists in location
            longitude = EXCLUDED.longitude,
            latitude = EXCLUDED.latitude,
            city = EXCLUDED.city,
            country = EXCLUDED.country;
        
        INSERT INTO user_pictures (user_id, url, is_profile)
        VALUES (v_user_id, 'generated_' || v_user_id || '_profile.jpg', TRUE);

        -- Assign interests to the user (e.g., assign 3 interests, cycling through all available interests)
        DECLARE
            assigned_interest_count INT := 3; -- Assign a fixed number of interests per user
            current_interest_index INT;
        BEGIN
            FOR j IN 0..assigned_interest_count - 1 LOOP
                current_interest_index := (i + j) % num_total_interests::int;
                INSERT INTO user_interests (user_id, interest_id)
                VALUES (v_user_id, interest_ids[current_interest_index + 1])
                ON CONFLICT (user_id, interest_id) DO NOTHING; -- Prevent duplicate interest assignments for the same user
            END LOOP;
        END;

    END LOOP;
END $$;