// Middleware to check if user has required role(s)
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    // Ensure user is attached to request (from authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.'
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource is restricted to ${roles.join(', ')} only.`
      });
    }

    next();
  };
};

module.exports = { authorizeRole };
