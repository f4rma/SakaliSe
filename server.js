require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const route = require('./routes/route');
const errorHandler = require('./services/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Connect to Database
connectDB();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/links', route);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║         LINKONCE SERVER               ║
║   One-Time Access Link System         ║
╠═══════════════════════════════════════╣
║ Status: Running                       ║
║ Port: ${PORT}                         ║
║ Environment: ${process.env.NODE_ENV}  ║
║ URL: http://localhost:${PORT}         ║
╚═══════════════════════════════════════╝
  `);
});

module.exports = { app, io };