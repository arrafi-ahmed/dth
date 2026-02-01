const express = require("express");
const router = express.Router();
const PaymentDispatcher = require("../payment");
const paymentService = require("../service/payment");
const ApiResponse = require("../model/ApiResponse");

/**
 * Unified Payment Controller - Generic Template
 * Generic endpoints for all payment gateways.
 */

// Initiate a payment
router.post("/init", async (req, res, next) => {
    try {
        const result = await paymentService.initiatePayment(req.body);
        res.status(200).json(new ApiResponse({ payload: result }));
    } catch (error) {
        next(error);
    }
});

/**
 * Generic Webhook Handler
 */
router.post("/webhook/:gateway", async (req, res, next) => {
    try {
        const { gateway } = req.params;
        const result = await PaymentDispatcher.handleWebhook(gateway, req.body, req.headers);

        if (result.status === 'paid') {
            await paymentService.finalizePayment({
                ...result,
                gateway
            });
        }

        res.status(200).json(new ApiResponse({ msg: "Processed" }));
    } catch (error) {
        console.error(`Webhook Error [${req.params.gateway}]:`, error);
        res.status(200).json(new ApiResponse({ msg: "Logged" }));
    }
});

// Manual Verification / Check Status
router.get("/verify/:gateway/:transactionId", async (req, res, next) => {
    try {
        const { gateway, transactionId } = req.params;
        const result = await PaymentDispatcher.verifyPayment(gateway, transactionId, req.query);

        if (result.status === 'paid') {
            await paymentService.finalizePayment({
                ...result,
                gateway
            });
        }

        res.status(200).json(new ApiResponse({ payload: result }));
    } catch (error) {
        next(error);
    }
});

// Check session status
router.get("/status/:sessionId", async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const result = await paymentService.checkStatusBySession(sessionId);
        res.status(200).json(new ApiResponse({ payload: result }));
    } catch (error) {
        next(error);
    }
});

// Explicit PROACTIVE VERIFICATION endpoint for Frontend
router.post("/verify-session", async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        const verifyResult = await paymentService.verifyAndFinalize(sessionId);
        res.status(200).json(new ApiResponse({ msg: "Processed", payload: verifyResult }));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
