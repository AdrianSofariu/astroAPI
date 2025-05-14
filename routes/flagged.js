const express = require("express");
const supabase = require("../supabase");
const router = express.Router();

// GET flagged (monitored) users with additional information
router.get("/", async (req, res) => {
  try {
    // Optional: pagination with 'offset' and 'limit' (defaults)
    const { data, error } = await supabase.rpc("get_flagged_users");

    if (error) {
        console.error("RPC error:", error.message);
    }
    // Format and send the response
    res.json({
      users: data.map(user => ({
        user_id: user.user_id,
        reason: user.reason,
        flagged_at: user.flagged_at,
        username: user.username,  // Extract username from profiles
        email: user.email,     // Extract email from auth.users
        role: user.role_name             // Extract role name from roles
      })),
    });
  } catch (error) {
    console.error("GET flagged users failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
