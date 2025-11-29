import express from 'express';
import { body, validationResult } from 'express-validator';  // Added validationResult import
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  updateProfilePicture
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import upload from "../middleware/upload.js";
const router = express.Router();
router.put(
  "/profile-picture",
  authMiddleware,
  upload.single("avatar"), // "avatar" = name of form field
  updateProfilePicture
);

// Helper middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()  // Returns an array of error details
    });
  }
  next();  // Proceed to the controller if no errors
};

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Public routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.put('/profile', authMiddleware, updateProfile);

export default router;

