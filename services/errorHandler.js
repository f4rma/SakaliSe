module.exports = (err, req, res, next) => {
  console.error('Terjadi kesalahan:', err);

  // validasi error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Kesalahan validasi data',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // error duplikasi data
  if (err.code === 23505) {
    return res.status(400).json({
      success: false,
      message: 'Data sudah ada',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // error default
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server'
  });
};