const { STRIPE_SECRET } = process.env;
const stripe = require("stripe")(STRIPE_SECRET);
const CustomError = require("../../model/CustomError");

/**
 * Stripe Payment Adapter - Generic Template
 */
class StripeAdapter {
    /**
     * Initiate Stripe Payment (Elements flow)
     * @param {Object} params 
     * @returns {Object} Action object
     */
    async initiatePayment({ amount, currency, metadata, receiptEmail }) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount),
                currency: currency.toLowerCase(),
                receipt_email: receiptEmail,
                automatic_payment_methods: { enabled: true },
                metadata: metadata,
            });

            return {
                action: 'elements',
                clientSecret: paymentIntent.client_secret,
                transactionId: paymentIntent.id,
                metadata: paymentIntent.metadata
            };
        } catch (error) {
            throw new CustomError(`Stripe Payment Initiation Failed: ${error.message}`, 400);
        }
    }

    /**
     * Verify Payment Status
     * @param {string} transactionId 
     * @returns {Object} Standardized status
     */
    async verifyPayment(transactionId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
            return {
                status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
                transactionId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                metadata: paymentIntent.metadata
            };
        } catch (error) {
            throw new CustomError(`Stripe Verification Failed: ${error.message}`, 400);
        }
    }

    /**
     * Update Intent Amount
     */
    async updateAmount(transactionId, amount, metadata = {}) {
        await stripe.paymentIntents.update(transactionId, {
            amount: Math.round(amount),
            metadata
        });
        return { success: true };
    }

    /**
     * Handle Stripe Webhook
     */
    async handleWebhook(payload, headers) {
        const sig = headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                payload,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            throw new CustomError(`Webhook Error: ${err.message}`, 400);
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            return {
                status: 'paid',
                transactionId: paymentIntent.id,
                metadata: paymentIntent.metadata,
                amount: paymentIntent.amount,
                rawResponse: paymentIntent
            };
        }

        return { status: 'ignored' };
    }
}

module.exports = new StripeAdapter();
