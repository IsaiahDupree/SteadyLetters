"use strict";
// Utility functions for backend
// Note: clsx and tailwind-merge are frontend-only dependencies
// This file is kept for compatibility but the cn function is not used in backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
function cn(...inputs) {
    // Simple implementation without frontend dependencies
    return inputs.filter(Boolean).join(' ');
}
