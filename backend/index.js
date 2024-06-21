const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'lead_management',
    password: 'your_db_password',
    port: 5432
});

const jwtSecret = 'your_secret_key';

// Middleware to protect routes
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ username: user.username, role: user.role }, jwtSecret, { expiresIn: '1h' });
            res.json({ token, role: user.role });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to login' });
    }
});




app.post('/addTrainer', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, hashedPassword, 'trainer']);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});






// Protected route example
app.get('/leads', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Function to generate a unique enrollment ID
function generateEnrollmentID() {
    return 'ENR' + Date.now().toString(36).toUpperCase();
}

// Get leads for trainers
app.get('/trainer/leads', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads WHERE status IN ($1, $2, $3, $4, $5, $6)', [
            'Training Progress',
            'Hands on Project',
            'Certificate Completion',
            'CV Build',
            'Mock Interviews',
            'Placement'
        ]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch leads for trainer' });
    }
});

// Get a single lead by ID
app.get('/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
});

// Add a new lead
app.post('/leads', authenticateToken, async (req, res) => {
    const { name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO leads (name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *',
            [name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to add lead' });
    }
});

// Update a lead by ID
app.put('/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status } = req.body;
    let enrollment_id = null;

    try {
        // Fetch the current status of the lead
        const currentLeadResult = await pool.query('SELECT status FROM leads WHERE lead_id = $1', [id]);
        const currentLead = currentLeadResult.rows[0];

        // Generate enrollment_id if status is changing from 'Enquiry' to 'Enrollment'
        if (currentLead.status === 'Enquiry' && status === 'Enrollment') {
            enrollment_id = generateEnrollmentID();
        }

        const result = await pool.query(
            `UPDATE leads SET name = $1, mobile_number = $2, email = $3, role = $4, college_company = $5, location = $6, source = $7, course_type = $8, course = $9, batch_name = $10, trainer_name = $11, trainer_mobile = $12, trainer_email = $13, actual_fee = $14, discounted_fee = $15, fee_paid = $16, fee_balance = $17, comments = $18, status = $19${enrollment_id ? ', enrollment_id = $20' : ''} WHERE lead_id = ${enrollment_id ? '$21' : '$20'} RETURNING *`,
            enrollment_id ? [name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, enrollment_id, id] : [name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// Update lead status for trainers
app.put('/trainer/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, comments, status } = req.body;

    try {
        const result = await pool.query(
            'UPDATE leads SET name = $1, mobile_number = $2, email = $3, role = $4, college_company = $5, location = $6, source = $7, course_type = $8, course = $9, batch_name = $10, trainer_name = $11, trainer_mobile = $12, trainer_email = $13, comments = $14, status = $15 WHERE lead_id = $16 RETURNING *',
            [name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, comments, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to update lead status' });
    }
});

// Delete a lead by ID for trainers
app.delete('/trainer/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM leads WHERE lead_id = $1', [id]);
        res.json({ message: 'Lead deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});
app.get('/courses', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT course FROM leads');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).send('Server error');
    }
});

app.get('/statuses', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT status FROM leads');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching statuses:', error);
        res.status(500).send('Server error');
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
