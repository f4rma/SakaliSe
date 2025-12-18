const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');

// Create new link
router.post('/', linkController.createLink);

// Check link status (without accessing)
router.get('/:token/check', linkController.checkLink);

// Access link (one-time)
router.get('/:token', linkController.accessLink);

// Get statistics
router.get('/stats/all', linkController.getStats);

module.exports = router;