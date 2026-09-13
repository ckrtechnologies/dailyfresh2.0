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

// Socket Events for Real-time Rider Tracking
io.on('connection', (socket) => {
  // Join a specific order room for private tracking
  socket.on('joinOrder', ({ orderId }) => {
    socket.join(`order_${orderId}`);
  });

  // Handle live location updates from Rider
  socket.on('updateLocation', (data) => {
    const { orderId, latitude, longitude, heading } = data;
    socket.to(`order_${orderId}`).emit('locationUpdated', {
      latitude,
      longitude,
      heading,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {});
});

// Attach io to app for use in controllers
app.set('io', io);

// Bind to 0.0.0.0 for reverse-proxy & container compatibility
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Daily Fresh API running on http://0.0.0.0:${PORT}`);
  console.log(`[Server] Mode: ${process.env.NODE_ENV || 'development'}`);
  
  const rzpKey = process.env.RAZORPAY_KEY_ID;
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  console.log(`[Razorpay] Key ID: ${rzpKey ? rzpKey.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`[Razorpay] Key Secret: ${rzpSecret ? rzpSecret.substring(0, 4) + '...' : 'MISSING'}`);
});

// Graceful Shutdown Handler for PM2 / Docker / systemd
const gracefulShutdown = (signal) => {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP and WebSocket connections closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Server] Forcefully shutting down after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
