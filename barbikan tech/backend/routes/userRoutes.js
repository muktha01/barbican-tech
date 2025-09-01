import { Router } from "express";
import {
  getAllUsers,
  loginUser,
  registerUser,
  getUserById,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
} from "../controllers/userController.js";

const router = Router();

// Public routes (no authentication required)
router.post("/register", registerUser);
router.post("/login", loginUser);


router.get("/users", getAllUsers);

// Get single user - authenticated users can view (admin can view all, staff can view own)
router.get("/users/:id", getUserById);

// Update user - admin can update any user, staff can update own profile
router.put("/users/:id", updateUser);

// Delete single user - admin only
router.delete("/users/:id", deleteUser);

// Bulk delete users - admin only
router.delete("/users/bulk", bulkDeleteUsers);

export default router;