const express = require("express");
const router = express.Router();
const { posts } = require("../data/posts");
const { types } = require("../data/types");
const path = require("path");
const url = require("url");
const fs = require("fs");

const postsMutex = require("../mutex"); // Import the shared mutex instance

const generateId = () => `${Date.now()}`;

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

    const result = await atomicOperation(() => {
      const typesArray = typesString ? typesString.split(",") : [];
      let filteredPosts = [...posts];

      if (search) {
        filteredPosts = filteredPosts.filter((post) =>
          post.title.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (typesArray.length > 0) {
        filteredPosts = filteredPosts.filter((post) =>
          typesArray.includes(post.type)
        );
      }

      const limitNumber = parseInt(limit, 10);
      const offsetNumber = parseInt(offset, 10);

      return {
        posts: filteredPosts.slice(offsetNumber, offsetNumber + limitNumber),
        total: filteredPosts.length,
        offset: offsetNumber + limitNumber,
        limit: limitNumber,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("GET operation failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE a new post
router.post("/", async (req, res) => {
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
      date: new Date(),
    };

    await atomicOperation(() => {
      posts.unshift(newPost);
      return true;
    });

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
    const result = await atomicOperation(() => posts);
    //return a json with a posts field
    res.status(200).json({ posts: result });
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

    const post = await atomicOperation(() =>
      posts.find((post) => post.id === id)
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (error) {
    console.error("GET post failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE a post by ID
router.put("/:id", async (req, res) => {
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
    if (!types.includes(postData.type)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    if (!/^[A-Za-z]/.test(postData.title)) {
      return res
        .status(400)
        .json({ message: "Title must start with a letter" });
    }

    const result = await atomicOperation(() => {
      const index = posts.findIndex((p) => p.id === id);
      if (index === -1) return { success: false };

      posts[index] = { ...posts[index], ...postData };
      return { success: true, post: posts[index] };
    });

    if (!result.success) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({
      message: "Post updated successfully",
      post: result.post,
    });
  } catch (error) {
    console.error("PUT operation failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE a post by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Post ID is required" });

    const result = await atomicOperation(() => {
      const index = posts.findIndex((p) => p.id === id);
      if (index === -1) return { success: false };
      // Get the post to delete
      const post = posts[index];

      // Get the image path from the post (assuming `imageSrc` stores the file name)
      console.log("Post to delete:", post);
      const parsedUrl = url.parse(post.source); // Parse the URL to get the path
      const imageFileName = path.basename(parsedUrl.pathname); // Extract file name from the URL path
      const imageFilePath = path.join(__dirname, "images", imageFileName);
      console.log("Image file path:", imageFilePath);

      // Delete the image file if it exists
      fs.exists(imageFilePath, (exists) => {
        if (exists) {
          fs.unlink(imageFilePath, (err) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Failed to delete image file" });
            }

            console.log(`Image ${post.imageSrc} deleted successfully.`);
          });
        }
      });

      posts.splice(index, 1);
      return { success: true };
    });

    if (!result.success) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("DELETE operation failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
