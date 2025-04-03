const express = require("express");
const router = express.Router();
const { types } = require("../data/types");

// Shared lock for consistency (even though this is read-only)
const typesMutex = require("../mutex"); // Import the shared mutex instance

const generateId = () => `${Date.now()}`;

// Helper function for atomic operations with lock
const atomicOperation = async (operation) => {
  const release = await typesMutex.acquire(); // Acquire the lock
  try {
    return await operation(); // Execute the operation while holding the lock
  } finally {
    release(); // Release the lock after the operation is completed
  }
};

// GET /api/types - Get all types
router.get("/", async (req, res) => {
  try {
    const result = await atomicOperation(() => types);
    res.status(200).json(result);
  } catch (error) {
    console.error("GET types failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
