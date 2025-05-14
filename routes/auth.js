const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require('dotenv').config();

const router = express.Router();

const supabase = require("../supabase");

router.use(cookieParser());

// POST /api/auth/register
router.post("/register", async (req, res) => {
    const { email, password, username } = req.body;
  
    if (!email || !password || !username) {
      return res.status(400).json({ message: "Missing required fields" });
    }
  
    try {
      // 1. Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
              username: username
            }
          }
      });
  
      if (signUpError) {
        return res.status(400).json({ message: "Error creating user", error: signUpError.message });
      }
  
      const userId = signUpData.user.id;
  
      // 2. Insert user profile with default role 'user'
      /*const { error: profileError } = await supabase
        .from('userdetails')
        .insert({
          id: userId,
          username: username,
          role_id: 2, // Assuming 2 = 'user' role in roles table
        });
  
      if (profileError) {
        return res.status(500).json({ message: "User created but profile insert failed", error: profileError.message });
      }*/
  
      res.status(200).json({ message: "User registered successfully", user: { id: userId, email, username } });
    } catch (err) {
      res.status(500).json({ message: "Unexpected error", error: err.message });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }
  
    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  
      if (authError || !authData.session) {
        return res.status(401).json({ message: "Invalid credentials", error: authError?.message });
      }
      const userId = authData.user.id;
  
      // 2. Fetch user profile & role
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select("id, username, role_id, roles(name)")
        .eq("id", userId)
        .single();
      if (profileError) {
        return res.status(500).json({ message: "Login succeeded but failed to fetch user profile", error: profileError.message });
      }
  
      const tokenPayload = {
        id: userProfile.id,
        username: userProfile.username,
        role: userProfile.roles?.name || "user",
      };
    
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });
    
      /*res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    
      return res.json({ message: "Login successful", user: tokenPayload });*/
      // Send token in the response body instead of setting a cookie
        return res.json({ message: "Login successful", token, user: tokenPayload });

    } catch (err) {
      res.status(500).json({ message: "Unexpected error", error: err.message });
    }
});
  
router.get("/me", (req, res) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
  
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      return res.json({ user });
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
});

module.exports = router;
  
  
  