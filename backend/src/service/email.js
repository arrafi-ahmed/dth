const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { appInfo } = require("../utils/common");
const { createTransport } = require("nodemailer");
const { getBrandingData } = require("../utils/branding");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VUE_BASE_URL } = process.env;
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.SMTP_USER || "dispatch@DTHLogistics.com";
const SENDER_NAME = process.env.SENDER_NAME || process.env.EMAIL_SENDER || "DTH Logistics";
const DISPATCH_EMAIL = process.env.DISPATCH_EMAIL || "dispatch@dealertradehouston.com";

// Only create transporter if SMTP credentials are provided
let transporter = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}

const processAttachments = async (attachments = []) => {
    const result = [];
    for (const attachment of attachments) {
        result.push(attachment);
    }
    return result;
};

exports.sendMail = async ({ to, subject, html, attachments }) => {
    // If no SMTP configuration, return mock response
    if (!transporter) {
        console.warn("SMTP not configured. Email not sent:", { to, subject });
        return { messageId: "mock-message-id" };
    }

    const mailOptions = {
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to,
        subject,
        html,
        attachments: attachments?.length
            ? await processAttachments(attachments)
            : [],
    };
    return transporter.sendMail(mailOptions);
};

const passwordResetTemplatePath = path.join(
    __dirname,
    "..",
    "templates",
    "passwordResetEmail.html",
);
const passwordResetTemplateSource = fs.readFileSync(passwordResetTemplatePath, "utf8");
const compilePasswordResetTemplate = handlebars.compile(passwordResetTemplateSource);

exports.sendPasswordReset = async ({ to, token }) => {
    try {
        const header = await getBrandingData();
        const resetLink = `${VUE_BASE_URL}/auth/reset-password?token=${token}`;
        const html = compilePasswordResetTemplate({
            header,
            appName: appInfo.name,
            resetLink,
            currentYear: new Date().getFullYear(),
        });

        const result = await exports.sendMail({
            to,
            subject: `Reset Your Password - ${appInfo.name}`,
            html,
        });

        return {
            success: true,
            messageId: result.messageId,
            to,
        };
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

const loadReleasedTemplatePath = path.join(
    __dirname,
    "..",
    "templates",
    "loadReleasedEmail.html",
);
const loadReleasedTemplateSource = fs.readFileSync(loadReleasedTemplatePath, "utf8");
const compileLoadReleasedTemplate = handlebars.compile(loadReleasedTemplateSource);

exports.DISPATCH_EMAIL = DISPATCH_EMAIL;

exports.sendLoadValidationNotification = async ({ loadId, vehicleInfo, pdfBuffer, to = DISPATCH_EMAIL, subject }) => {
    try {
        const header = await getBrandingData();
        const emailSubject = subject || `Load Validated: ${loadId} - ${appInfo.name}`;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h1>Load Document Generated</h1>
                <p>A new load document has been generated.</p>
                <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Load ID:</strong> ${loadId}</p>
                    <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
                </div>
                <p>The authorization PDF is attached to this email.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">DTH Logistics Portal</p>
            </div>
        `;

        await exports.sendMail({
            to,
            subject: emailSubject,
            html,
            attachments: [{
                filename: `DTH_Release_${loadId}.pdf`,
                content: pdfBuffer
            }]
        });

        return { success: true };
    } catch (error) {
        console.error("Error sending validation email:", error);
        return { success: false, error: error.message };
    }
};

exports.sendReleaseNotification = async ({ to, dispatcherName, loadId, vehicleInfo, confirmedBy, pickupLocation, timestamp, attachments = [] }) => {
    try {
        const header = await getBrandingData();
        const html = compileLoadReleasedTemplate({
            header,
            dispatcherName,
            loadId,
            vehicleInfo,
            confirmedBy, // Correctly mapped now
            pickupLocation, // Added
            timestamp,
            currentYear: new Date().getFullYear(),
        });

        const result = await exports.sendMail({
            to,
            subject: `Vehicle Released: ${loadId} - ${appInfo.name}`,
            html,
            attachments
        });

        return {
            success: true,
            messageId: result.messageId,
            to,
        };
    } catch (error) {
        console.error("Error sending release notification email:", error);
        // Don't throw to prevent blocking the release process if email fails
        return { success: false, error: error.message };
    }
};
