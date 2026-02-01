const { STRIPE_SECRET } = process.env;
const stripe = require("stripe")(STRIPE_SECRET);
const CustomError = require("../model/CustomError");

/**
 * Stripe Service - Generic Template
 * Handles low-level Stripe operations.
 */

exports.createProduct = async ({ payload }) => {
    return await stripe.products.create(payload);
};

exports.updateProduct = async ({ id, payload }) => {
    return await stripe.products.update(id, payload);
};

exports.deleteProduct = async ({ id }) => {
    return await stripe.products.del(id);
};

exports.createPrice = async ({ payload }) => {
    return await stripe.prices.create(payload);
};

/**
 * Create a simple Payment Intent
 */
exports.createPaymentIntent = async ({ amount, currency, metadata = {}, receiptEmail }) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency: currency.toLowerCase(),
            receipt_email: receiptEmail,
            metadata: metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    } catch (error) {
        throw new CustomError(`Stripe Error: ${error.message}`, 400);
    }
};

/**
 * [TEMPLATE] Process Webhook or Verification Metadata
 * Replace ticketing logic with your own.
 */
exports.getRegistrationFromPaymentIntentMetadata = async (paymentIntentId) => {
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // [PLACEHOLDER] Implement your own data retrieval and finalization logic
    console.log(`[StripeService] Placeholder for finalizing intent ${paymentIntentId}`);
    return { success: true, message: "Template placeholder executed" };
};
