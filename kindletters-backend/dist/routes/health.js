"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    try {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'kindletters-backend',
            environment: process.env.NODE_ENV || 'development',
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Health check failed',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
