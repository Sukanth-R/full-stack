const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/signupDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Mongoose User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Mongoose Password Schema
const passwordSchema = new mongoose.Schema({
  website: { type: String, required: true },
  password: { type: String, required: true },
  userEmail: { type: String, required: true } // Add userEmail field
});

const Password = mongoose.model('Password', passwordSchema);

// In-memory OTP store (for demo purposes)
let otpStore = {};

// Global variable to store logged email
let loggedEmail = null;

// Nodemailer transporter setup (replace with your email credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '',
    pass: '', // Use the app password if 2FA is enabled
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Route to generate and send OTP for login
app.post('/generate-otp', async (req, res) => {
  const { email } = req.body;

  // Check if email exists in the database
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const otp = generateOTP();
  otpStore[email] = otp; // Store OTP temporarily
  console.log(`OTP for ${email}: ${otp}`); // For debugging, remove in production

  const mailOptions = {
    from: '"PasswordManager" <abc@gmail.com>',
    to: email,
    subject: 'Your OTP for Login',
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email OTP</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          max-width: 500px;
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        h1 {
          color: #3b82f6; /* Blue color for the header */
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .divider {
          width: 100%;
          height: 1px;
          background-color: #ddd;
          margin: 20px 0;
        }
        .otp {
          font-size: 36px;
          font-weight: bold;
          color: #28a745; /* Green color for OTP */
          margin: 20px 0;
        }
        p {
          color: #555;
          font-size: 16px;
          margin: 10px 0;
        }
        .footer {
          font-size: 12px;
          color: #888;
          margin-top: 20px;
        }
        .footer a {
          color: #3b82f6;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Email OTP</h1>
        <div class="divider"></div>
        <p>Dear User,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div class="otp">${otp}</div>
        <p>Please use this OTP to complete your login process. Do not share this code with anyone.</p>
        <p>Thank you for using Email OTP!</p>
        <div class="footer">
          <p>&copy; 2024 PasswordManager. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Failed to send OTP' });
    }
    res.status(200).json({ message: 'OTP sent successfully!' });
  });
});

// Login route with OTP verification
app.post('/login', async (req, res) => {
  const { email, password, otp } = req.body;

  // Check if email exists in the database
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // Verify OTP
  if (otpStore[email] !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // Clear OTP after successful login
  delete otpStore[email];

  // Store the logged email in a global variable
  loggedEmail = email;

  // Return logged email in response
  res.status(200).json({ 
    message: 'Login successful', 
    user: { username: user.username, email: user.email },
    loggedEmail // Send the logged email back to the client
  });
});

// Route to save passwords
app.post('/save-password', async (req, res) => {
  const { website, password } = req.body;

  // Validate input
  if (!website || !password || !loggedEmail) {
    return res.status(400).json({ error: 'Website, password, and user email are required' });
  }

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newPassword = new Password({ website, password: hashedPassword, userEmail: loggedEmail }); // Associate password with logged email
    await newPassword.save();
    res.status(201).json({ message: 'Password saved successfully!' });
  } catch (error) {
    console.error('Error saving password:', error);
    res.status(500).json({ error: 'Failed to save password.' });
  }
});
app.get('/display', async (req, res) => {
  if (!loggedEmail) {
    return res.status(401).json({ error: 'User is not logged in' });
  }

  try {
    // Fetch all passwords associated with the logged-in user
    const users = await User.find({ email: loggedEmail });
    const passwords=await Password.find({email:loggedEmail});

    // Generate HTML content
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Passwords</title>
      </head>
      <body>
        <h1>Profile</h1>
        ${users.length > 0 
          ? `<ul>${users.map(user => `
              <li>
                <strong>User ID:</strong> ${user._id} <br>
                <strong>User Name:</strong> ${user.username} <br>
                <strong>Email:</strong> ${user.email}
              </li>
            `).join('')}</ul>`
          : `<p>No passwords found.</p>`
        }
        <h1>My Passwords</h1>
        ${passwords.length > 0 
          ? `<ul>${passwords.map(password => `
              <li>
                <strong>User ID:</strong> ${password.website} <br>
                <strong>User Name:</strong> ${password.userEmail} <br>
                <strong>Email:</strong> ${password.password}
              </li>
            `).join('')}</ul>`
          : `<p>No passwords found.</p>`
        }
      </body>
      </html>
    `;

    // Set Content-Type to text/html
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error('Error fetching passwords:', error);
    res.status(500).send('<h1>Failed to fetch passwords</h1>');
  }
});


// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
