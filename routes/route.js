const express = require('express');
const controller = require('../controllers/linkController');

const router = express.Router();

router.post('/', linkController.createLink);
router.get('/:token/check', linkController.checkLink);
router.get('/:token', linkController.accessLink);

module.exports = router;
