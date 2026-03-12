"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserRole = Object.freeze({
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    CUSTOMER: 'CUSTOMER',
});
const OrderStatus = Object.freeze({
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
});
const PaymentStatus = Object.freeze({
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
});
module.exports = {
    UserRole,
    OrderStatus,
    PaymentStatus,
};
