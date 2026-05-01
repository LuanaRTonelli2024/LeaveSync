const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateToken = (id, email) => {
    const jwtSecret = process.env.JWT_SECRET;
    return jwt.sign({ id, email }, jwtSecret, { expiresIn: "1d" });
};

const serializeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    hireDate: user.hireDate,
    createdAt: user.createdAt,
});

const register = async (req, res) => {
    try {
        const { name, email, password, role, department, hireDate } = req.body;

        if (!name || !email || !password || !hireDate) {
            return res.status(400).json({
                message: "Name, email, password and hire date are required."
            });
        }

        const existingUser = await User.findOne({ email: String(email).toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "employee",
            department,
            hireDate: new Date(hireDate)
        });

        return res.status(201).json({
            message: "User registered successfully.",
            data: {
                user: serializeUser(user)
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error while registering the user."
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = generateToken(String(user._id), user.email);

        return res.json({
            message: "Login successful.",
            data: {
                token,
                user: serializeUser(user)
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error while logging in."
        });
    }
};

const getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.json({
            message: "Authenticated user fetched successfully.",
            data: {
                user: serializeUser(user)
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error while fetching authenticated user."
        });
    }
};

module.exports = { register, login, getMe };