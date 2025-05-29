-- Create tickets table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(100) NOT NULL,
    total_tickets INTEGER NOT NULL,
    available_tickets INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tickets_count INTEGER NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    UNIQUE(user_id, event_id)
);

-- Insert sample events
INSERT INTO events (name, description, event_date, location, total_tickets, available_tickets, price) VALUES
('Концерт "Океан Ельзи"', 'Великий концерт гурту "Океан Ельзи" на стадіоні', '2025-06-15 19:00:00', 'Київ, НСК Олімпійський', 1000, 1000, 500.00),
('Вистава "Наталка Полтавка"', 'Класична українська вистава', '2025-06-20 18:00:00', 'Львів, Театр опери та балету', 500, 500, 300.00),
('Фестиваль "Atlas Weekend"', 'Найбільший музичний фестиваль України', '2025-07-10 12:00:00', 'Київ, ВДНГ', 5000, 5000, 1200.00),
('Футбольний матч Україна-Польща', 'Товариський матч національних збірних', '2025-06-05 20:00:00', 'Київ, НСК Олімпійський', 2000, 2000, 400.00),
('Виставка сучасного мистецтва', 'Експозиція робіт українських художників', '2025-06-01 10:00:00', 'Одеса, Музей сучасного мистецтва', 300, 300, 150.00);
