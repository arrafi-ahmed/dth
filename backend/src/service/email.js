const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { appInfo } = require("../utils/common");
const { createTransport } = require("nodemailer");
const { getBrandingData } = require("../utils/branding");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VUE_BASE_URL } = process.env;
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.SMTP_USER || "dispatch@DTHLogistics.com";
const SENDER_NAME = process.env.SENDER_NAME || process.env.EMAIL_SENDER || "DTH Logistics";

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
