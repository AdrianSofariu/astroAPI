const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const postsRouter = require("./routes/posts");
const typesRouter = require("./routes/types");
const healthRouter = require("./routes/health");
const filesRouter = require("./routes/files");
const imagesRouter = require("./routes/images");
const { initializeSocket } = require("./websocket_generation/generator_utils");
const path = require("path"); // Add this line

const app = express();
const server = http.createServer(app); // Create an HTTP server for Express and WebSockets

// Configure CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3001",
  ...(process.env.NODE_ENV === "development"
    ? ["http://127.0.0.1:3000", "http://localhost:3000"]
    : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.some((allowed) => {
        const normalizedOrigin = origin.replace(/\/$/, "");
        const normalizedAllowed = allowed.replace(/\/$/, "");
        return normalizedOrigin === normalizedAllowed;
      })
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS.`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

// Middleware (order matters!)
app.use(cors(corsOptions)); // CORS first
app.use(bodyParser.json()); // Then body parsing

const imagesPath = path.join(__dirname, "images");
app.use("/images", express.static(imagesPath)); // Serve static images from the 'images' directory
// Routes
app.use("/api/posts", postsRouter);
app.use("/api/types", typesRouter);
app.use("/api/health", healthRouter);
app.use("/api/files", filesRouter);
app.use("/api/images", imagesRouter); // Serve static files

// Enhanced error handling
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS.") {
    res.status(403).json({ message: "CORS policy violation" });
  } else {
    console.error("Server error:", err.stack);
    res.status(500).json({ message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001; // Set API port

// Start server and WebSocket
server.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});

// Initialize WebSockets on the same server
initializeSocket(server);
