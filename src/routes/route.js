const express = require('express');
const controller = require('../controllers/linkController');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/', upload.array('files'),controller.createLink);
router.get('/:token/check', controller.checkLink);
router.get('/:token', controller.accessLink);

module.exports = router;
