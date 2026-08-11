import jwt from "jsonwebtoken";

export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Validate JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable is not set!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact administrator.',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
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

// Export authorizeRoles as an alias for requireRole
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('🛡️ Role middleware: Checking role...');
    console.log('👤 User:', req.user?.email, 'Role:', req.user?.role);
    console.log('✅ Required roles:', roles.join(', '));

    if (!req.user) {
      console.log('❌ User not authenticated');
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Access denied - wrong role');
      return res.status(403).json({
        success: false,
        message: `Access denied. This route requires role: ${roles.join(
          " or "
        )}`,
      });
    }

    console.log('✅ Role authorized');

    next();
  };
};
