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
  
  // Join a specific order room for private tracking
  socket.on('joinOrder', ({ orderId }) => {
    socket.join(`order_${orderId}`);
    console.log(`[Socket] ${socket.id} joined tracking for order: ${orderId}`);
  });

  // Handle live location updates from Rider
  socket.on('updateLocation', (data) => {
    const { orderId, latitude, longitude, heading } = data;
    // Broadcast to everyone in the order room EXCEPT the sender
    socket.to(`order_${orderId}`).emit('locationUpdated', {
      latitude,
      longitude,
      heading,
      timestamp: new Date()
    });
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

