//Middleware global untuk menangani seluruh error aplikasi
module.exports = (err, req, res, next) => {
  console.error('Terjadi kesalahan:', err);

  // Error validasi data 
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Kesalahan validasi data',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Error duplikasi data (umumnya dari database)
  if (err.code === 23505) {
    return res.status(400).json({
      success: false,
      message: 'Data sudah ada'
    });
  }

  // Error default (internal server error)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server'
  });
};
