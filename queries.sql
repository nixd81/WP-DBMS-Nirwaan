
CREATE TABLE CAFE (
    CAFE_ID INT PRIMARY KEY AUTO_INCREMENT,
    NAME VARCHAR(100),
    LOCATION VARCHAR(100),
    DESCRIPTION VARCHAR(255),
    PHOTO_URL VARCHAR(255),
    DISABILITY CHAR(1)
);

CREATE TABLE USER (
    USER_ID INT PRIMARY KEY AUTO_INCREMENT,
    USERNAME VARCHAR(100),
    PASSWORD VARCHAR(255),
    PHONE_NUMBER VARCHAR(20)
);

CREATE TABLE CUISINE (
    CUISINE_ID INT PRIMARY KEY AUTO_INCREMENT,
    NAME VARCHAR(100)
);
 
CREATE TABLE CAFE_CUISINE (
    CAFE_CUISINE_ID INT PRIMARY KEY AUTO_INCREMENT,
    CAFE_ID INT,
    CUISINE_ID INT,
    FOREIGN KEY (CAFE_ID) REFERENCES CAFE(CAFE_ID),
    FOREIGN KEY (CUISINE_ID) REFERENCES CUISINE(CUISINE_ID)
);
 
CREATE TABLE MENU (
    MENU_ID INT PRIMARY KEY AUTO_INCREMENT,
    NAME VARCHAR(100),
    PRICE DECIMAL(10,2),
    CUISINE_ID INT,
    CAFE_ID INT,
    FOREIGN KEY (CUISINE_ID) REFERENCES CUISINE(CUISINE_ID),
    FOREIGN KEY (CAFE_ID) REFERENCES CAFE(CAFE_ID)
);
 
CREATE TABLE TIME_SLOT (
    TIME_SLOT_ID INT PRIMARY KEY AUTO_INCREMENT,
    CAFE_ID INT,
    CAPACITY INT,
    SLOT_TIME TIME,
    FOREIGN KEY (CAFE_ID) REFERENCES CAFE(CAFE_ID)
);
 
CREATE TABLE RESERVATION (
    RESERVATION_ID INT PRIMARY KEY AUTO_INCREMENT,
    USER_ID INT,
    CAFE_ID INT,
    DATE DATE,
    TIME_SLOT_ID INT,
    PARTY_SIZE INT,
    FOREIGN KEY (USER_ID) REFERENCES USER(USER_ID),
    FOREIGN KEY (CAFE_ID) REFERENCES CAFE(CAFE_ID),
    FOREIGN KEY (TIME_SLOT_ID) REFERENCES TIME_SLOT(TIME_SLOT_ID)
);
 
CREATE TABLE ADMIN (
    ADMIN_ID INT PRIMARY KEY AUTO_INCREMENT,
    USERNAME VARCHAR(100),
    PASSWORD VARCHAR(255)
);



INSERT INTO CUISINE (NAME) VALUES 
('Indian'), ('Chinese'), ('Italian'), ('Thai'), ('Continental');

INSERT INTO CAFE (NAME, LOCATION, DESCRIPTION, PHOTO_URL, DISABILITY) VALUES
('Bandra Bistro', 'Bandra', 'Cozy cafe with Indian and Continental food', 'https://example.com/bandra.jpg', 'Y'),
('Spice Garden', 'Bandra', 'Authentic Indian and Thai cuisine', 'https://example.com/spice.jpg', 'N'),
('Noodle House', 'Juhu', 'Best Chinese food in town', 'https://example.com/noodle.jpg', 'Y'),
('Pasta Palace', 'Andheri', 'Italian specialties with local twist', 'https://example.com/pasta.jpg', 'Y'),
('Curry Leaf', 'Andheri', 'South Indian and Thai fusion', 'https://example.com/curry.jpg', 'N'),
('Beachside Cafe', 'Juhu', 'Continental with ocean view', 'https://example.com/beach.jpg', 'Y');

INSERT INTO CAFE_CUISINE (CAFE_ID, CUISINE_ID) VALUES
(1, 1), (1, 5),  -- Bandra Bistro: Indian, Continental
(2, 1), (2, 4),  -- Spice Garden: Indian, Thai
(3, 2),          -- Noodle House: Chinese
(4, 3),          -- Pasta Palace: Italian
(5, 1), (5, 4),  -- Curry Leaf: Indian, Thai
(6, 5);          -- Beachside Cafe: Continental

INSERT INTO MENU (NAME, PRICE, CUISINE_ID, CAFE_ID) VALUES
-- Bandra Bistro items
('Butter Chicken', 350, 1, 1),
('Paneer Tikka', 300, 1, 1),
('Margherita Pizza', 400, 5, 1),
-- Spice Garden items
('Chicken Biryani', 320, 1, 2),
('Green Curry', 380, 4, 2),
-- Noodle House items
('Hakka Noodles', 250, 2, 3),
('Manchurian', 220, 2, 3),
-- Pasta Palace items
('Spaghetti Carbonara', 420, 3, 4),
('Margherita Pizza', 380, 3, 4),
-- Curry Leaf items
('Masala Dosa', 180, 1, 5),
('Tom Yum Soup', 280, 4, 5),
-- Beachside Cafe items
('Club Sandwich', 320, 5, 6),
('Fish & Chips', 450, 5, 6);

]INSERT INTO TIME_SLOT (CAFE_ID, CAPACITY, SLOT_TIME) VALUES
-- Bandra Bistro slots
(1, 10, '12:00:00'), (1, 10, '13:00:00'), (1, 15, '19:00:00'),
-- Spice Garden slots
(2, 8, '12:30:00'), (2, 8, '19:30:00'),
-- Noodle House slots
(3, 12, '11:00:00'), (3, 12, '13:00:00'), (3, 15, '20:00:00'),
-- Pasta Palace slots
(4, 6, '12:00:00'), (4, 6, '18:00:00'),
-- Curry Leaf slots
(5, 10, '11:30:00'), (5, 10, '13:30:00'), (5, 10, '20:30:00'),
-- Beachside Cafe slots
(6, 8, '10:00:00'), (6, 8, '12:00:00'), (6, 10, '19:00:00');

[INSERT INTO RESERVATION (USER_ID, CAFE_ID, DATE, TIME_SLOT_ID, PARTY_SIZE) VALUES
(1, 1, CURDATE(), 1, 5),  -- Bandra Bistro 12:00 slot has 5/10
(1, 3, CURDATE(), 6, 8),   -- Noodle House 13:00 slot has 8/12
(1, 6, CURDATE(), 13, 3);  -- Beachside Cafe 19:00 slot has 3/10

]INSERT INTO USER (USERNAME, PASSWORD, PHONE_NUMBER) VALUES
('testuser', 'password123', '9876543210');
