import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/index.js";

export const registerUser = async (req, res) => {
  try {
    const { username, mobile_number, password, role } = req.body;
    const existingUser = await User.findOne({ where: { mobile_number } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      mobile_number,
      password: hashedPassword,
      role,
    });
    return res
      .status(201)
      .json({ 
        message: "User registered successfully.", 
        user: { 
          id: user.id, 
          username: user.username, 
          mobile_number: user.mobile_number, 
          role: user.role 
        } 
      });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    console.log(req.body);
    const { username, password } = req.body;
    console.log("Login request body:", req.body);
    console.log("Searching for user with username:", username);
    
    if (!req.body) {
      return res.status(400).json({ message: "Body missing from request" });
    }
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    
    const user = await User.findOne({ where: { username } });
    console.log("User found:", user ? JSON.stringify(user) : "No user found");
    
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    
    console.log('User password hash:', user.password);
    
    // Fixed: Using bcrypt to compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    
    const JWT_SECRET = "your_super_secret_key_here"; // Use env variable in production
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  console.log("Fetching all users");
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.status(200).json({ message: "Users retrieved successfully", users });
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, { 
      attributes: { exclude: ["password"] } 
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ 
      message: "User retrieved successfully", 
      user 
    });
  } catch (err) {
    console.error("Get User Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, mobile_number, password, role } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if mobile number is being changed and if it already exists
    if (mobile_number && mobile_number !== user.mobile_number) {
      const existingUser = await User.findOne({ 
        where: { mobile_number } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          message: "Mobile number already exists" 
        });
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (mobile_number) updateData.mobile_number = mobile_number;
    if (role) updateData.role = role;
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    await user.update(updateData);
    
    // Return updated user without password
    const updatedUser = await User.findByPk(id, { 
      attributes: { exclude: ["password"] } 
    });
    
    res.status(200).json({ 
      message: "User updated successfully", 
      user: updatedUser 
    });
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await user.destroy();
    
    res.status(200).json({ 
      message: "User deleted successfully",
      deletedUser: {
        id: user.id,
        username: user.username,
        mobile_number: user.mobile_number,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Bulk delete users (admin only)
export const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        message: "Please provide an array of user IDs" 
      });
    }
    
    const deletedCount = await User.destroy({
      where: {
        id: userIds
      }
    });
    
    res.status(200).json({ 
      message: `${deletedCount} users deleted successfully`,
      deletedCount 
    });
  } catch (err) {
    console.error("Bulk Delete Users Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};