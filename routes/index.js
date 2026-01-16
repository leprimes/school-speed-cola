const express = require('express');
const router = express.Router();

router.use(require('./users.routes'));
router.use(require('./services.routes'));
router.use(require('./categories.routes'));
router.use(require('./auth.routes'));
router.use(require('./chats.routes'));
router.use(require('./contracts.routes'));
router.use(require('./resenas.routes'));

module.exports = router;
