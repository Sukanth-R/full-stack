const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // For OTP generation

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

// Mongoose Schema for User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// In-memory OTP store (for demo, you can also store in a database with expiry time)
let otpStore = {};

// Nodemailer transporter setup (replace with your email credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '',
    pass: '', // Use the app password if 2FA is enabled
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates (useful in development)
  },
});

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Route to generate and send OTP
app.post('/generate-otp', async (req, res) => {
  const { username,email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = generateOTP();
  otpStore[email] = otp; // Store OTP temporarily
  console.log(otp);

  const mailOptions = {
    from: '"PasswordManager" <abc@gmail.email>',
    to: email,
    subject: 'Your OTP Code',
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
    <p>Dear ${username},</p>
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

// Signup route (with OTP verification)
app.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword, otp } = req.body;

  // Basic validation
  if (!username || !email || !password || !confirmPassword || !otp) {
    return res.status(400).json({ error: 'Please fill in all fields' });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // Verify OTP
  if (otpStore[email] !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with hashed password
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    
    // Clear OTP after successful signup
    delete otpStore[email];

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error saving user to database:', error);
    res.status(500).json({ error: 'Error saving user to database' });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
