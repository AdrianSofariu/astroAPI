const express = require("express");
const router = express.Router();

// Shared lock to ensure consistent status checks
let operationLock = Promise.resolve();

// GET /api/health - Health check route
router.get("/", async (req, res) => {
  try {
    const result = await operationLock.then(() => ({
      status: "ok",
      message: "Server is running",
    }));
    res.status(200).json(result);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
