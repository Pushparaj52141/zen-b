const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');
const format = require('pg-format');
const twilio = require('twilio');
const { createObjectCsvWriter } = require('csv-writer');

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


const accountSid = 'AC2b0253bb2becc815092242c95ff25665'; // Your Account SID from www.twilio.com/console
const authToken = '1619a2c4e6f3928de600819ca30e1666';   // Your Auth Token from www.twilio.com/console

const client = new twilio(accountSid, authToken);

client.messages.create({
    body: 'Hello from Zen',
    to: '+919003177131',  // Text this number
    from: '+16467831665' // From a valid Twilio number
})
.then((message) => console.log(message.sid))
.catch((error) => console.error(error));

// Multer setup for file upload
const upload = multer({ dest: 'uploads/' });

// Function to generate a unique enrollment ID
function generateEnrollmentID() {
    return 'ENR' + Date.now().toString(36).toUpperCase();
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

// Add trainer route
app.post('/addTrainer', authenticateToken, async (req, res) => {
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

// Fetch all leads except archived
app.get('/leads', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads WHERE status != $1', ['Archived']);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Fetch archived leads
app.get('/leads/archived', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads WHERE status = $1', ['Archived']);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch archived leads' });
    }
});

// Get leads for trainers
app.get('/trainer/leads', authenticateToken, async (req, res) => {
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
    const { name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, paid_status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO leads (name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, paid_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *',
            [name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, paid_status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to add lead' });
    }
});

// Export leads to CSV
app.get('/exportLeads', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads');
        const leads = result.rows;

        const csvWriter = createObjectCsvWriter({
            path: 'leads.csv',
            header: [
                { id: 'lead_id', title: 'Lead ID' },
                { id: 'name', title: 'Name' },
                { id: 'mobile_number', title: 'Mobile Number' },
                { id: 'email', title: 'Email' },
                { id: 'role', title: 'Role' },
                { id: 'college_company', title: 'College/Company' },
                { id: 'location', title: 'Location' },
                { id: 'source', title: 'Source' },
                { id: 'course_type', title: 'Course Type' },
                { id: 'course', title: 'Course' },
                { id: 'batch_name', title: 'Batch Name' },
                { id: 'trainer_name', title: 'Trainer Name' },
                { id: 'trainer_mobile', title: 'Trainer Mobile' },
                { id: 'trainer_email', title: 'Trainer Email' },
                { id: 'actual_fee', title: 'Actual Fee' },
                { id: 'discounted_fee', title: 'Discounted Fee' },
                { id: 'fee_paid', title: 'Fee Paid' },
                { id: 'fee_balance', title: 'Fee Balance' },
                { id: 'comments', title: 'Comments' },
                { id: 'status', title: 'Status' },
                { id: 'paid_status', title: 'Paid Status' }
            ]
        });

        await csvWriter.writeRecords(leads);
        res.download(path.join(__dirname, 'leads.csv'), 'leads.csv', (err) => {
            if (err) {
                res.status(500).send('Error downloading the file.');
            }
            fs.unlinkSync(path.join(__dirname, 'leads.csv')); // Delete file after download
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to export leads' });
    }
});




// Bulk upload leads from CSV
app.post('/leads/bulk-upload', authenticateToken, upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    const leads = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            leads.push([
                row.name,
                row.mobile_number,
                row.email,
                row.role,
                row.college_company,
                row.location,
                row.source,
                row.course_type,
                row.course,
                row.batch_name,
                row.trainer_name,
                row.trainer_mobile,
                row.trainer_email,
                row.actual_fee,
                row.discounted_fee,
                row.fee_paid,
                row.fee_balance,
                row.comments,
                row.status,
                row.paid_status
            ]);
        })
        .on('end', async () => {
            try {
                const result = await pool.query(format(
                    'INSERT INTO leads (name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, paid_status) VALUES %L RETURNING *',
                    leads
                ));
                res.json(result.rows);
            } catch (err) {
                console.error('Error uploading leads:', err);
                res.status(500).json({ error: 'Failed to upload leads' });
            } finally {
                fs.unlinkSync(filePath); // Remove the uploaded file
            }
        });
});

// Update a lead by ID
app.put('/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, paid_status } = req.body;
    let enrollment_id = null;

    try {
        // Fetch the current status of the lead
        const currentLeadResult = await pool.query('SELECT status FROM leads WHERE lead_id = $1', [id]);
        const currentLead = currentLeadResult.rows[0];

        // Generate enrollment_id if status is changing from 'Enquiry' to 'Enrollment'
        if (currentLead.status === 'enquiry' && status === 'enrollment') {
            enrollment_id = generateEnrollmentID();
        }

        const result = await pool.query(
            `UPDATE leads SET name = $1, mobile_number = $2, email = $3, role = $4, college_company = $5, location = $6, source = $7, course_type = $8, course = $9, batch_name = $10, trainer_name = $11, trainer_mobile = $12, trainer_email = $13, actual_fee = $14, discounted_fee = $15, fee_paid = $16, fee_balance = $17, comments = $18, status = $19, paid_status = $20${enrollment_id ? ', enrollment_id = $21' : ''} WHERE lead_id = ${enrollment_id ? '$22' : '$21'} RETURNING *`,
            enrollment_id ? [name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, paid_status, enrollment_id, id] : [name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, actual_fee, discounted_fee, fee_paid, fee_balance, comments, status, paid_status, id]
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
    const { name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, comments, status, paid_status } = req.body;

    try {
        const result = await pool.query(
            'UPDATE leads SET name = $1, mobile_number = $2, email = $3, role = $4, college_company = $5, location = $6, source = $7, course_type = $8, course = $9, batch_name = $10, trainer_name = $11, trainer_mobile = $12, trainer_email = $13, comments = $14, status = $15, paid_status = $16 WHERE lead_id = $17 RETURNING *',
            [name, mobile_number, email, role, college_company, location, source, course_type, course, batch_name, trainer_name, trainer_mobile, trainer_email, comments, status, paid_status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to update lead status' });
    }
});

// Delete a lead by ID
app.delete('/leads/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM leads WHERE lead_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.json({ message: 'Lead deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Archive a lead by ID
app.put('/leads/archive/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('UPDATE leads SET status = $1 WHERE lead_id = $2 RETURNING *', ['Archived', id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to archive lead' });
    }
});

// Restore a lead by ID
app.put('/leads/restore/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query('UPDATE leads SET status = $1 WHERE lead_id = $2 RETURNING *', [status, id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to restore lead' });
    }
});

// Get distinct courses for filters
app.get('/courses', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT course FROM leads');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).send('Server error');
    }
});

// Get distinct statuses for filters
app.get('/statuses', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT status FROM leads');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching statuses:', error);
        res.status(500).send('Server error');
    }
});

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pushparajraje52141@gmail.com',
        pass: 'qekwexivgbadufzc'
    }
});

// Scheduled job to send reminders for leads in 'Enquiry' status for more than 1 day
cron.schedule('* * * * *', async () => { // This runs the job every minute for testing
    try {
        const result = await pool.query('SELECT * FROM leads WHERE status = $1 AND created_at < NOW() - INTERVAL \'1 day\'', ['Enquiry']);
        const leads = result.rows;

        leads.forEach(lead => {
            const mailOptions = {
                from: 'pushparajraje52141@gmail.com',
                to: lead.email,
                subject: 'Follow-up on Your Enquiry',
                text: `Hi ${lead.name},\n\nWe noticed that you haven't enrolled in any course yet. Please let us know if you need any assistance.\n\nBest regards,\nYour Team`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });
        });
    } catch (err) {
        console.error('Error fetching leads for reminder:', err);
    }
});




app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
