import { io } from "socket.io-client";
import jwt from "jsonwebtoken";

const secret = "your_fallback_super_secure_sha256_string_here";
const token = jwt.sign({ id: "test", username: "Scout" }, secret);

const socket = io("https://outpost-app.onrender.com", {
  auth: { token },
  transports: ["websocket"]
});

socket.on("connect_error", (err) => {
  console.error("Connect Error:", err.message);
  process.exit(1);
});

socket.on("connect", () => {
  console.log("Connected to Socket.io!");
  
  socket.on("receive_message", (msg) => {
    console.log("Received message:", JSON.stringify(msg, null, 2));
    process.exit(0);
  });

  const messageData = {
    channelKey: "1_1",
    user: {
      username: "Scout",
      profilePictureUrl: "",
      level: 1
    },
    time: "Today at 12:00 PM",
    type: "poll",
    pollData: {
      question: "Test Poll?",
      options: ["Yes", "No"],
      votesArray: [],
      votesMap: { 0: [], 1: [] }
    }
  };

  console.log("Emitting send_message...");
  socket.emit("send_message", messageData);

  setTimeout(() => {
    console.log("Timeout waiting for receive_message");
    process.exit(1);
  }, 5000);
});
