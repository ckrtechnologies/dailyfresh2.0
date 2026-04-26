import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './src/app.js';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: '*',
    allowedHeaders: '*'
  }
});

// Basic Socket Events
io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);
  
  // Role-based room joining
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`[Socket] ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// Attach io to app for use in controllers
app.set('io', io);

server.listen(PORT, () => {
  console.log(`[Server] Daily Fresh API running on http://localhost:${PORT}`);
  console.log(`[Server] Mode: ${process.env.NODE_ENV}`);
  
  // Razorpay Key Check
  const rzpKey = process.env.RAZORPAY_KEY_ID;
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  console.log(`[Razorpay] Key ID starts with: ${rzpKey ? rzpKey.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`[Razorpay] Key Secret starts with: ${rzpSecret ? rzpSecret.substring(0, 4) + '...' : 'MISSING'}`);
});

