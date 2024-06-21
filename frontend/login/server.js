//server.js
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;
app.use(cors());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'lead_management',
    password: 'your_db_password',
    port: 5432,
});

const jwtSecret = 'your_jwt_secret_key'; // Keep this secret and secure

// Enable CORS for all routes
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Allow requests from this origin
    credentials: true // Allow cookies and headers
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware to verify JWT
const verifyJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ success: false, message: 'Unauthorized' });

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '1h' });
            res.json({ success: true, token, redirect: user.role === 'admin' ? '/frontend/admin/admin.html' : '/trainer.html' });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});

app.post('/addTrainer', verifyJWT, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { trainerUsername, trainerPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(trainerPassword, 10);
        await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [trainerUsername, hashedPassword, 'trainer']);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
