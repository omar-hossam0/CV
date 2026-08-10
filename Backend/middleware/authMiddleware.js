import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  // Temporary bypass if SKIP_AUTH=true (for local testing only)
  if (process.env.SKIP_AUTH === 'true') {
    req.user = {
      _id: '000000000000000000000000',
      id: '000000000000000000000000',
      email: 'dev@local.test',
      role: process.env.SKIP_AUTH_ROLE || 'admin',
      name: 'Dev User'
    };
    return next();
  }
  try {
    console.log('🔐 Auth middleware: Checking token...');
    console.log('📍 Request URL:', req.method, req.originalUrl);

    const authHeader = req.headers.authorization;

    console.log('🔑 Auth header:', authHeader ? 'EXISTS' : 'MISSING');

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: "No token provided. Access denied",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-here"
    );

    console.log('✅ Token decoded:', decoded.email, decoded.role);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log('✅ User authenticated:', user.email, user.role);

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    res.status(500).json({
      success: false,
      message: "Token verification failed",
      error: error.message,
    });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${allowedRoles.join(
            ", "
          )}. Your role: ${req.user.role}`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Role verification failed",
        error: error.message,
      });
    }
  };
};

// Export protect as an alias for verifyToken
export const protect = verifyToken;
