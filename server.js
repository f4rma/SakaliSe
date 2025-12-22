require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const linkRoutes = require('./src/routes/route');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


/* ===============================
   SOCKET.IO
================================ */
io.on('connection', socket => {
  socket.on('join-link', token => {
    socket.join(token);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/links', linkRoutes);

app.use(errorHandler);

/* ===============================
   START SERVER
================================ */
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SakaliSe running at http://localhost:${PORT}`);
});
