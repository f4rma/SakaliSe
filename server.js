// sebagai entry point aplikasi SakaliSe.
// Menginisialisasi Express, HTTP Server, dan Socket.IO.

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Import routing dan middleware utama
const ruteTautan = require('./src/routes/route');
const penangananKesalahan = require('./src/middlewares/kelolaError');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware Aplikasi
// Digunakan untuk parsing request & static file
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


//  KOnfigurasi Socket.IO
// Digunakan untuk mekanisme "burn tab"
io.on('connection', socket => {
  console.log('Socket terhubung:', socket.id);

// Setiap tab akan masuk ke "room" berdasarkan token link
//   agar tab lain bisa ditutup saat link dibuka   
  socket.on('join-link', token => {
    console.log(`Socket ${socket.id} bergabung ke room ${token}`);
    socket.join(token);
  });
});


// Menyisipkan instance Socket.IO ke request agar bisa diakses di controller
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routing Utama
app.use('/api/links', ruteTautan);

// Middleware penanganan error 
app.use(penangananKesalahan);

/* =================
   Jalankan Server
==================== */
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SakaliSe berjalan di http://localhost:${PORT}`);
});
