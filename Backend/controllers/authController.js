import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: email, password, name, role",
      });
    }

    // Accept user, hr, or employee roles
    const validRoles = ["user", "hr", "employee"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role must be 'user', 'hr', or 'employee'",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Please use a different email.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      },
      process.env.JWT_SECRET || "your-secret-key-here",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: `${role === "hr" ? "HR" : "User"} registered successfully`,
      token: token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        profileImage: newUser.profileImage || null,
        phone: newUser.phone || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    // Temporary maintenance mode for login
    if (process.env.DISABLE_LOGIN === "true") {
      return res.status(503).json({
        success: false,
        message: "Login temporarily disabled (maintenance mode).",
      });
    }
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ["user", "hr", "employee"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Role must be 'user', 'hr', or 'employee'",
        });
      }
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if role matches (if role is provided)
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This account is registered as ${
          user.role === "hr" ? "HR" : "Student"
        }. Please select the correct account type.`,
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET || "your-secret-key-here",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        profileImage: user.profileImage || null,
        phone: user.phone || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        avatar: req.user.avatar || null,
        profileImage: req.user.profileImage || null,
        phone: req.user.phone || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { name, email, avatar, phone, location } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof avatar !== "undefined") user.avatar = avatar;
    if (typeof phone !== "undefined") user.phone = phone;
    if (typeof location !== "undefined") user.location = location;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        profileImage: user.profileImage || null,
        phone: user.phone || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};

// ============================================
// Update My Password - المستخدم يغير الباسورد (Protected)
// ============================================
export const updateMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    console.log("🔐 Update password request for user:", userId);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      console.log("❌ Current password is incorrect");
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    console.log("✅ Password updated for user:", user.email);

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("❌ Update Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating password",
      error: error.message,
    });
  }
};

// ============================================
// Delete My Account - المستخدم يحذف حسابه (Protected)
// ============================================
export const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("🗑️ Delete account request for user:", userId);

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ Account deleted for user:", user.email);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Account Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting account",
      error: error.message,
    });
  }
};

// ============================================
// HR ONLY: Get All Users
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    console.log("📋 Get all users request by HR:", req.user._id);

    const users = await User.find().select("-password");

    console.log(`✅ Found ${users.length} users`);

    res.json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.error("❌ Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// ============================================
// HR ONLY: Get User By ID
// ============================================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 Get user by ID request:", id);

    const user = await User.findById(id).select("-password");

    if (!user) {
      console.log("❌ User not found with ID:", id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ User found:", user.email);

    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("❌ Get User By ID Error:", error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

// ============================================
// HR ONLY: Update User
// ============================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    console.log("✏️ Update user request for ID:", id);

    const user = await User.findById(id);

    if (!user) {
      console.log("❌ User not found with ID:", id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        console.log("❌ Email already exists:", email);
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    if (role && role !== "user" && role !== "hr") {
      console.log("❌ Invalid role:", role);
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role must be either 'user' or 'hr'",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    console.log("✅ User updated:", user.email);

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Update User Error:", error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating user",
      error: error.message,
    });
  }
};

// ============================================
// HR ONLY: Delete User
// ============================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Delete user request for ID:", id);

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      console.log("❌ User not found with ID:", id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ User deleted:", user.email);

    res.json({
      success: true,
      message: "User deleted successfully",
      deletedUser: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("❌ Delete User Error:", error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};

// ============================================
// Upload Profile Image - رفع صورة البروفايل
// ============================================
export const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Convert image to base64
    const imageBase64 = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Update user with profile image
    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageBase64 },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      profileImage: imageBase64,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("❌ Upload Profile Image Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading image",
      error: error.message,
    });
  }
};
