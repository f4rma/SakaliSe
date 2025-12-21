const express = require('express');
const controller = require('../controllers/linkController');

const router = express.Router();

router.post('/', controller.createLink);
router.get('/:token/check', controller.checkLink);
router.get('/:token', controller.accessLink);

module.exports = router;
