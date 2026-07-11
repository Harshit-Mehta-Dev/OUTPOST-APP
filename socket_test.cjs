const { io } = require("socket.io-client");
console.log("Connecting to WSS...");
const socket = io("https://outpost-app.onrender.com", {
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("✅ Socket connected!");
  socket.emit('join_channel', '1_1');
  console.log("Joined channel 1_1");
  setTimeout(() => process.exit(0), 1000);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
