const express = require("express");
const router = express.Router();
const { posts } = require("../data/posts");
const { types } = require("../data/types");
const path = require("path");
const url = require("url");
const fs = require("fs");
const supabase = require("../supabase");
const authenticateUser = require("../authMiddleware");
const postsMutex = require("../mutex"); // Import the shared mutex instance

//const generateId = () => `${Date.now()}`;
const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;


// Helper function for atomic operations with lock
const atomicOperation = async (operation) => {
  const release = await postsMutex.acquire(); // Acquire the lock
  try {
    return await operation(); // Execute the operation while holding the lock
  } finally {
    release(); // Release the lock after the operation is completed
  }
};

// GET all posts with optional filters
router.get("/", async (req, res) => {
  try {
    const { search, types: typesString, offset = "0", limit = "8" } = req.query;

    const offsetNum = parseInt(offset, 10);
    const limitNum = parseInt(limit, 10);
    const typesArray = typesString ? typesString.split(",") : [];

    let query = supabase
      .from("Posts")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })     // Primary sort: by date
      .order("id", { ascending: false })       // Secondary sort: by ID
      .range(offsetNum, offsetNum + limitNum - 1);

    // Chain filters only if values exist
    if (search?.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    if (typesArray.length > 0) {
      query = query.in("type", typesArray);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      posts: data,
      total: count || 0,
      offset: offsetNum + data.length,
      limit: limitNum,
    });
  } catch (error) {
    console.error("GET operation failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE a new post
router.post("/", authenticateUser, async (req, res) => {
  try {
    const postData = req.body;

    if (
      !postData.title ||
      !postData.source ||
      !postData.type ||
      !postData.subject
    ) {
      return res
        .status(400)
        .json({ message: "All fields except ID are required" });
    }

    if (!types.includes(postData.type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    if (!/^[A-Za-z]/.test(postData.title)) {
      return res
        .status(400)
        .json({ message: "Title must start with a letter" });
    }

    const newPost = {
      id: postData.id || generateId(),
      title: postData.title,
      type: postData.type,
      subject: postData.subject,
      source: postData.source,
      date: new Date(postData.date).toISOString(),
      user_id: req.user.id,
    };

    /*await atomicOperation(() => {
      posts.unshift(newPost);
      return true;
    });*/

    const { data, error } = await supabase.from('Posts').insert([newPost]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await supabase.from("logs").insert([
      {
        user_id: req.user.id,
        action: `ADD to posts`,
      },
    ]);

    res.status(201).json({
      message: "Post created successfully",
      id: newPost.id,
      post: newPost,
    });
  } catch (error) {
    console.error("POST operation failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET all posts (no filters)
router.get("/all", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Posts").select("*");
    if (error) throw error;

    res.status(200).json({ posts: data });
  } catch (error) {
    console.error("GET posts failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// GET a specific post by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Post ID is required" });

    //const { data, error } = await supabase.from("Posts").select("*").eq("id", id).single();
    const { data, error } = await supabase
      .from("Posts")
      .select("id, title, source, subject, type, date, user_id, profiles(username)")  // Get all columns from Posts and the username from Profiles
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ message: "Post not found" });
    }

    const flattenedData = {
      ...data, // Spread all fields from the post
      username: data.profiles?.username, // Move username out of the 'profiles' object
    };
    delete flattenedData.profiles;
    res.json(flattenedData);
  } catch (error) {
    console.error("GET post failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE a post by ID
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const postData = req.body;

    if (
      !postData.title ||
      !postData.source ||
      !postData.type ||
      !postData.subject
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    postData.user_id = req.user.id;
    postData.date = new Date(postData.date).toISOString();

    const { data: validTypes, error: typeErr } = await supabase
      .from("Types")
      .select("name");
    if (typeErr) throw typeErr;

    const typeList = validTypes.map((t) => t.name);
    if (!typeList.includes(postData.type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    if (!/^[A-Za-z]/.test(postData.title)) {
      return res.status(400).json({ message: "Title must start with a letter" });
    }

    const { data, error } = await supabase
      .from("Posts")
      .update(postData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ message: "Post not found" });
    }

    await supabase.from("logs").insert([
      {
        user_id: req.user.id,
        action: `UPDATE in posts`,
      },
    ]);

    res.json({
      message: "Post updated successfully",
      post: data,
    });
  } catch (error) {
    console.error("PUT operation failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE a post by ID
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: post, error: findError } = await supabase
      .from("Posts")
      .select("*")
      .eq("id", id)
      .single();

    if (findError) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Attempt to delete associated image if local
    const parsedUrl = url.parse(post.source);
    const imageFileName = path.basename(parsedUrl.pathname);
    const imageFilePath = path.join(__dirname, "images", imageFileName);

    fs.exists(imageFilePath, (exists) => {
      if (exists) {
        fs.unlink(imageFilePath, (err) => {
          if (err) {
            console.error("Failed to delete image:", err);
          } else {
            console.log(`Image ${imageFileName} deleted successfully.`);
          }
        });
      }
    });

    const { error } = await supabase.from("Posts").delete().eq("id", id);
    if (error) throw error;

    await supabase.from("logs").insert([
      {
        user_id: req.user.id,
        action: `DELETE from posts`,
      },
    ]);

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("DELETE operation failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
