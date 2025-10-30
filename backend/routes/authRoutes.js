const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { logUserAction } = require('../utils/logger');
const bcrypt = require('bcryptjs');
const OTP = require('../models/otpModel');
const { sendOtpRequest, generateOtp } = require('../utils/createOtp');

router.post('/login', async (req, res) => {
    const { user_name, user_password, user_type } = req.body;

    try {
        // First find the user by username and type
        const user = await User.findOne({ user_name, user_type });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let isValidPassword = false;

        // Different password verification based on user type
        if (user.user_type === 'volunteer') {
            // Direct password comparison for volunteers
            isValidPassword = user_password === user.user_password;
        } else {
            // For admins, use direct comparison (no hashing)
            isValidPassword = user_password === user.user_password;
        }

        if (isValidPassword) {
            // For admin and volunteer on login update the list of visits if not already present
            const currentMonthYear = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

            // Check if the current month-year already exists in the list
            const visitExists = user.list_of_visits.some(visit => visit.timestamp === currentMonthYear);

            if (!visitExists) {
                user.list_of_visits.push({ timestamp: currentMonthYear });
                await user.save();
            }

            // Remember that your using the user._id i.e., the MongoDB ObjectId as the id in the JWT token
            const token = jwt.sign({ id: user._id, user_type: user.user_type }, 'your_jwt_secret');

            // Log the successful login action
            const logEntry = await logUserAction(user._id, `${user.user_type} login successful`);

            res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    user_name: user.user_name,
                    user_type: user.user_type
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


const otpSchema = new mongoose.Schema({
    phone_number: { type: String, required: true },
    otp: { type: String, required: true },
    // Temporarily store the data for the user to be created
    userData: {
        user_name: { type: String, required: true },
        user_email: { type: String, required: true },
        user_age: { type: Number, required: true },
        user_password: { type: String, required: true }, // IMPORTANT: This must be the HASHED password
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // The document will be automatically deleted after 5 minutes (300 seconds)
        expires: 300
    }
});


// ROUTE 1: SIGNUP - SEND OTP (Now works with the new model)
router.post('/signup-send-otp', async (req, res) => {
    try {
        const { user_name, user_phone_no, user_email, user_age, user_password } = req.body;

        // ... (validation is the same)
        const existingUser = await User.findOne({ $or: [{ user_email }, { user_phone_no }] });
        if (existingUser) return res.status(400).json({ message: 'Email or phone number already exists.' });

        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(user_password, salt);
        hashedPassword = user_password
        const otp = generateOtp();

      console.log(otp)


        // Send the SMS
        const otpResult = await sendOtpRequest(otp, user_phone_no);
      console.log(otpResult)
        if (otpResult.status != "success") return res.status(500).json({ message: 'Failed to send OTP.' });

        await OTP.updateOne(
            { phone_number: user_phone_no },
            {
                otp: otp,
                userData: {
                    user_name,
                    user_email,
                    user_age,
                    user_password: hashedPassword,
                }
            },
            { upsert: true }
        );

        return res.status(200).json({ message: 'OTP sent successfully.' });

    } catch (error) {
        console.error('ERROR IN SEND-OTP:', error);
        return res.status(500).json({ message: 'Server error while preparing OTP.' });
    }
});


// ROUTE 2: VERIFY OTP AND CREATE USER
// This route replaces the old /verify-otp logic
router.post('/signup-verify-otp', async (req, res) => {
    try {
        const { phone_no, otp } = req.body;

        if (!phone_no || !otp) {
            return res.status(400).json({ message: 'Phone number and OTP are required' });
        }

        // --- 1. Find the OTP record ---
        const otpRecord = await OTP.findOne({ phone_number: phone_no, otp: otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
        }

        // --- 2. DATA IS VALIDATED, NOW CREATE THE USER ---
        const { userData } = otpRecord;

        // Generate a new user_id
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const nextUserId = lastUser ? lastUser.user_id + 1 : 1;

        const newUser = new User({
            user_id: nextUserId,
            user_name: userData.user_name,
            user_email: userData.user_email,
            user_phone_no: phone_no,
            user_age: userData.user_age,
            user_password: userData.user_password,
            user_type: 'volunteer',
            isVerified: true, // User is verified by default in this flow
        });
        await newUser.save();

        // --- 3. Clean up the used OTP ---
        await OTP.deleteOne({ _id: otpRecord._id });

        // --- 4. Generate JWT to log the user in ---
        const payload = { id: newUser._id, userId: newUser.user_id, name: newUser.user_name };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        return res.status(201).json({
            message: 'Account created successfully!',
            token: token,
            user: { id: newUser._id, name: newUser.user_name, email: newUser.user_email }
        });

    } catch (error) {
        console.error('Error verifying OTP and creating user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
