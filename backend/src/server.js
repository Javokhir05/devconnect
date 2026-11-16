import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/posts.routes.js";
import commentRoutes from "./routes/comments.routes.js";
import userRoutes from "./routes/users.routes.js";
import skillRoutes from "./routes/skills.routes.js";
import http from "node:http";
import chatRoutes from "./routes/chat.routes.js";
import { initSocket } from "./socket.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/conversations", chatRoutes);


app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);
server.listen(PORT, () => console.log(`API running on port ${PORT}`));