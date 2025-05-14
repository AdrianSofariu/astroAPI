const express = require("express");
const router = express.Router();
const { types } = require("../data/types");
const supabase = require("../supabase");

// Shared lock for consistency (even though this is read-only)

const generateId = () => `${Date.now()}${Math.floor(Math.random() * 1000000)}`;

const generatePost = async () => {
    const newPost1 = {
        id: generateId(),
        title: "Polar Star",
        type: "star",
        subject: "Alpha Ursae Minoris (Polaris)",
        source:
        "https://media.istockphoto.com/id/464482266/photo/stars-in-the-milky-way.jpg?s=612x612&w=0&k=20&c=RCIb2u0jE6JwLZfVsf7Nz-tq9K8NlqVmY6iHmN5wnh0=",
        date: new Date().toISOString(),
    };

    const newPost2 = {
        id: generateId(),
        title: "Image 1",
        type: "galaxy",
        subject: "Milky Way",
        source:
            "https://darksky.org/app/uploads/2021/07/DSC_8700-Pano-Edit-scaled.jpg",
        date: new Date().toISOString(),
    }

    // Randomly choose between the two posts
    const randomPost = Math.random() < 0.5 ? newPost1 : newPost2;

    // Insert the selected post into the database
    const { data, error } = await supabase.from('Posts').insert([randomPost]);

    if (error) {
        console.error('Error inserting post:', error);
    }
};

// GET /api/addbulk - Get all types
router.get("/", async (req, res) => {
    try {
      const posts = [];
  
      // Collect posts in a loop
      for (let i = 0; i < 2000; i++) {
        const newPost1 = {
          id: generateId(),
          title: "Polar Star",
          type: "star",
          subject: "Alpha Ursae Minoris (Polaris)",
          source: "https://media.istockphoto.com/id/464482266/photo/stars-in-the-milky-way.jpg?s=612x612&w=0&k=20&c=RCIb2u0jE6JwLZfVsf7Nz-tq9K8NlqVmY6iHmN5wnh0=",
          date: new Date().toISOString(),
        };
  
        const newPost2 = {
          id: generateId(),
          title: "Image 1",
          type: "galaxy",
          subject: "Milky Way",
          source: "https://darksky.org/app/uploads/2021/07/DSC_8700-Pano-Edit-scaled.jpg",
          date: new Date().toISOString(),
        };
  
        // Randomly choose a post and add to the array
        const randomPost = Math.random() < 0.5 ? newPost1 : newPost2;
        posts.push(randomPost);
      }
  
      // Insert all posts at once
      const { data, error } = await supabase.from('Posts').insert(posts);
  
      if (error) {
        throw error;
      }
  
      // Send response after the insertion
      res.status(200).json({ message: "Successfully added 2000 posts" });
    } catch (error) {
      console.error("GET types failed:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
module.exports = router;
