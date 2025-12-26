// Mendefinisikan endpoint API untuk tautan sekali pakai
const express = require('express');
const controller = require('../controllers/linkController');
const unggah = require('../middlewares/unggah');

const router = express.Router();

// Membuat link baru (dengan upload file)
router.post('/', unggah.array('files'), controller.buatTautan);

// Mengecek validitas link 
router.get('/:token/check', controller.cekTautan);

// Mengakses link (sekali pakai) 
router.get('/:token', controller.aksesTautan);

module.exports = router;
