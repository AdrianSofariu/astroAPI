const { Server } = require("socket.io");
const { posts } = require("../data/posts");
const postsMutex = require("../mutex"); // Import shared mutex

let io;
let isGenerating = false;
let interval = null;

// Function to generate a new post (but NOT send it to clients)
const generatePost = async () => {
  await postsMutex.runExclusive(() => {
    const newPost = {
      id: Date.now().toString(),
      title: "Polar Star",
      type: "star",
      subject: "Alpha Ursae Minoris (Polaris)",
      source:
        "https://media.istockphoto.com/id/464482266/photo/stars-in-the-milky-way.jpg?s=612x612&w=0&k=20&c=RCIb2u0jE6JwLZfVsf7Nz-tq9K8NlqVmY6iHmN5wnh0=",
      date: new Date(),
    };

    posts.unshift(newPost);
    console.log("New post generated. Notifying clients...");
    io.emit("update"); // Notify all clients to fetch new posts
  });
};

// Function to start generating posts every 10 seconds
const startGenerating = () => {
  if (!isGenerating) {
    isGenerating = true;
    interval = setInterval(generatePost, 10000);
    console.log("Post generation started...");
  }
};

// Function to stop generating posts
const stopGenerating = () => {
  if (isGenerating) {
    isGenerating = false;
    clearInterval(interval);
    console.log("Post generation stopped.");
  }
};

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Change this to your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("start", () => {
      console.log("Starting post generation...");
      startGenerating();
    });

    socket.on("stop", () => {
      console.log("Stopping post generation...");
      stopGenerating();
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  console.log("Socket.IO server initialized");
};

module.exports = { initializeSocket };
