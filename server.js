const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const app = express();
const port = 3000;


const db = require("./db");

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Session middleware to store user selections
const session = require('express-session');
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Routes
app.get("/", (req, res) => res.sendFile(__dirname + "/views/display.html"));
app.get("/login-selection", (req, res) => res.sendFile(__dirname + "/views/login-selection.html"));
app.get("/login", (req, res) => res.sendFile(__dirname + "/views/login.html"));
app.get("/register", (req, res) => res.sendFile(__dirname + "/views/register.html"));

// Customer flow routes
app.get("/party-size", (req, res) => res.sendFile(__dirname + "/views/party-size.html"));
app.get("/budget", (req, res) => res.sendFile(__dirname + "/views/budget.html"));
app.get("/location", (req, res) => res.sendFile(__dirname + "/views/location.html"));
app.get("/cuisine", (req, res) => res.sendFile(__dirname + "/views/cuisine.html"));
app.get("/accessibility", (req, res) => res.sendFile(__dirname + "/views/accessibility.html"));
// New GET routes for the HTML pages
app.get("/cafes", (req, res) => res.sendFile(__dirname + "/views/cafes.html"));
app.get("/recommend-menu", (req, res) => res.sendFile(__dirname + "/views/recommended-menu.html"));
app.get("/time-slots", (req, res) => res.sendFile(__dirname + "/views/time-slots.html"));
app.get("/customer-dashboard", (req, res) => res.sendFile(__dirname + "/views/customer_dashboard.html"));
app.get("/confirm-booking", (req, res) => res.sendFile(__dirname + "/views/booking_confirmation.html"));


// New API endpoints to fetch data for the pages
app.get("/get-filtered-cafes", (req, res) => {
    const { partySize, budget, location, cuisine, disability } = req.session;
    
    let sql = `
        SELECT c.* FROM CAFE c
        WHERE c.LOCATION = ? 
        AND c.disability = ?
    `;
    
    if (cuisine && cuisine !== 'any') {
        sql += ` AND c.CAFE_ID IN (
            SELECT cc.CAFE_ID FROM CAFE_CUISINE cc
            JOIN CUISINE cu ON cc.CUISINE_ID = cu.CUISINE_ID
            WHERE cu.NAME = ?
        )`;
    }
    
    const params = [location, disability];
    if (cuisine && cuisine !== 'any') params.push(cuisine);
    
    db.query(sql, params, (err, cafes) => {
        if (err) return res.status(500).json({ error: "Error fetching cafes" });
        
        const cafeIds = cafes.map(c => c.CAFE_ID);
        if (cafeIds.length === 0) {
            return res.json([]);
        }
        
        const capacitySql = `
            SELECT ts.CAFE_ID FROM TIME_SLOT ts
            WHERE ts.CAFE_ID IN (?)
            AND ts.CAPACITY >= ?
            GROUP BY ts.CAFE_ID
        `;
        
        db.query(capacitySql, [cafeIds, partySize], (err, capableCafes) => {
            if (err) return res.status(500).json({ error: "Error checking capacity" });
            
            const capableCafeIds = capableCafes.map(c => c.CAFE_ID);
            const filteredCafes = cafes.filter(c => capableCafeIds.includes(c.CAFE_ID));
            
            res.json(filteredCafes);
        });
    });
});

app.get("/get-recommended-menu", (req, res) => {
    const cafeId = req.query.cafeId || req.session.lastCafeId;
    const { partySize, budget } = req.session;
    const totalBudget = budget * partySize;
    
    if (!cafeId) return res.status(400).json({ error: "No cafe selected" });
    
    db.query('SELECT * FROM CAFE WHERE CAFE_ID = ?', [cafeId], (err, cafeResult) => {
        if (err) return res.status(500).json({ error: "Error fetching cafe" });
        if (cafeResult.length === 0) return res.status(404).json({ error: "Cafe not found" });
        
        const cafe = cafeResult[0];
        
        const sql = `SELECT m.* FROM MENU m WHERE m.CAFE_ID = ? ORDER BY m.PRICE ASC`;
        
        db.query(sql, [cafeId], (err, menuItems) => {
            if (err) return res.status(500).json({ error: "Error fetching menu" });
            
            // Convert PRICE to Number if it comes as string
            const processedItems = menuItems.map(item => ({
                ...item,
                PRICE: Number(item.PRICE)
            }));
            
            let currentTotal = 0;
            const recommendedItems = [];
            
            for (const item of processedItems) {
                if (currentTotal + item.PRICE <= totalBudget) {
                    recommendedItems.push(item);
                    currentTotal += item.PRICE;
                }
            }
            
            res.json({
                success: true,
                cafe: cafe,
                menu: recommendedItems,
                total: currentTotal,
                totalBudget: totalBudget,
                budgetPerPerson: budget,
                partySize: partySize
            });
        });
    });
});

app.get("/get-available-time-slots", (req, res) => {
    const cafeId = req.query.cafeId || req.session.lastCafeId;
    const { partySize } = req.session;
    const date = new Date().toISOString().split('T')[0];
    
    if (!cafeId) return res.status(400).json({ error: "No cafe selected" });
    
    const sql = `
        SELECT * FROM TIME_SLOT
        WHERE CAFE_ID = ? 
        AND CAPACITY >= ?
        AND TIME_SLOT_ID NOT IN (
            SELECT TIME_SLOT_ID FROM RESERVATION
            WHERE CAFE_ID = ? AND DATE = ?
            GROUP BY TIME_SLOT_ID
            HAVING COUNT(*) >= (
                SELECT CAPACITY FROM TIME_SLOT WHERE TIME_SLOT_ID = RESERVATION.TIME_SLOT_ID
            )
        )
        ORDER BY SLOT_TIME
    `;
    
    db.query(sql, [cafeId, partySize, cafeId, date], (err, timeSlots) => {
        if (err) return res.status(500).json({ error: "Error fetching time slots" });
        
        res.json({
            timeSlots: timeSlots,
            cafeId: cafeId,
            date: date
        });
    });
});

// POST routes to store user selections in session
app.post("/party-size", (req, res) => {
    req.session.partySize = parseInt(req.body.partySize);
    res.redirect("/budget");
});

app.post("/budget", (req, res) => {
    req.session.budget = parseFloat(req.body.budget);
    res.redirect("/location");
});

app.post("/location", (req, res) => {
    req.session.location = req.body.location;
    res.redirect("/cuisine");
});
app.post("/confirm-booking", (req, res) => {
    res.redirect("/confirm-booking");
});
app.post("/cuisine", (req, res) => {
    req.session.cuisine = req.body.cuisine;
    res.redirect("/accessibility");
});

// Update these POST routes in your app.js
app.post("/accessibility", (req, res) => {
    req.session.disability = req.body.disability === 'yes' ? 'Y' : 'N';
    res.redirect("/cafes");
});

app.post("/recommend-menu", (req, res) => {
    req.session.lastCafeId = req.body.cafeId;
    res.redirect("/recommend-menu");
});

app.post("/time-slots", (req, res) => {
    res.redirect("/time-slots");
});
app.post("/customer-dashboard", (req, res) => {
    res.redirect("/party-size");
});

app.post("/register", (req, res) => {
    const { username, password, phone } = req.body;
    const sql = "INSERT INTO USER (USERNAME, PASSWORD, PHONE_NUMBER) VALUES (?, ?, ?)";
    db.query(sql, [username, password, phone], (err, result) => {
        if (err) return res.send("Registration error: " + err);
        res.redirect("/login");
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM USER WHERE USERNAME = ? AND PASSWORD = ?";
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.send("Login error: " + err);
        if (results.length > 0) {
            req.session.userId = results[0].USER_ID;
            res.redirect("/customer-dashboard");
        } else {
            res.send("Invalid credentials");
        }
    });
});
// Add this route to your app.js
app.get('/get-available-cuisines', (req, res) => {
    const sql = "SELECT DISTINCT c.NAME FROM CUISINE c JOIN CAFE_CUISINE cc ON c.CUISINE_ID = cc.CUISINE_ID";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching cuisines:', err);
            return res.status(500).json({ error: 'Error fetching available cuisines' });
        }
        res.json(results);
    });
});
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));