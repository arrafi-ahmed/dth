const { query } = require("../db");
const jwt = require("jsonwebtoken");
const CustomError = require("../model/CustomError");
const appUserService = require("./appUser");
const { hash, compare } = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const emailService = require("./email");

const generateAuthData = async (user) => {
    // Generic role handling: Admin (20) or User (40)
    const effectiveRole = Number(user.role);

    const userObj = {
        id: user.id,
        email: user.email,
        role: effectiveRole,
        fullName: user.fullName || user.full_name,
        timezone: user.timezone,
    };

    let redirect = "/";
    if (effectiveRole === 20) redirect = "/admin/dashboard";
    else redirect = "/dashboard"; // Default user dashboard

    const token = jwt.sign(
        { currentUser: userObj },
        process.env.TOKEN_SECRET,
        { expiresIn: '24h' }
    );

    return {
        token,
        currentUser: userObj,
        redirect,
    };
};

exports.getCurrentUser = async ({ currentUser }) => {
    if (!currentUser || !currentUser.id) {
        throw new CustomError("User not authenticated", 401);
    }

    const user = await appUserService.getUserById({ userId: currentUser.id });
    if (!user) {
        throw new CustomError("User not found", 404);
    }

    return {
        id: user.id,
        email: user.email,
        role: Number(user.role),
        fullName: user.fullName,
        timezone: user.timezone,
    };
};

exports.updateUserTimezone = async ({ userId, timezone }) => {
    if (!timezone) return;
    const sql = `UPDATE app_user SET timezone = $1 WHERE id = $2`;
    await query(sql, [timezone, userId]);
};

exports.signin = async ({ email, password, timezone }) => {
    const user = await appUserService.getUserByEmail({ email });

    if (!user?.email) {
        throw new CustomError("User not found!", 401);
    }
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
        throw new CustomError("Incorrect email/password!", 401);
    }

    if (timezone) {
        await exports.updateUserTimezone({ userId: user.id, timezone });
        user.timezone = timezone;
    }

    return await generateAuthData(user);
};

exports.register = async ({ payload }) => {
    // Generic registration: Default to User role (40)
    const userRole = payload.role || 40;

    const newUser = {
        fullName: payload.fullName,
        email: payload.email,
        password: await hash(payload.password, 10),
        role: userRole,
        timezone: payload.timezone || null
    };

    try {
        const sql = `
            INSERT INTO app_user (full_name, email, password, role, timezone, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *
        `;
        const values = [
            newUser.fullName,
            newUser.email,
            newUser.password,
            newUser.role,
            newUser.timezone,
        ];
        const result = await query(sql, values);
        const upsertedUser = result.rows[0];

        return await generateAuthData(upsertedUser);
    } catch (err) {
        if (err.code === "23505") {
            throw new CustomError("Email already taken!", 409);
        } else throw err;
    }
};

exports.savePasswordResetRequest = async ({ email, token }) => {
    const sql = `
        INSERT INTO password_reset_requests (email, token, expires_at, created_at)
        VALUES ($1, $2, $3, NOW()) RETURNING *
    `;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const result = await query(sql, [email, token, expiresAt]);
    return result.rows[0];
};

exports.validateResetToken = async ({ token }) => {
    const sql = `
        SELECT *
        FROM password_reset_requests
        WHERE token = $1
          AND expires_at > NOW()
          AND used = false
    `;
    const result = await query(sql, [token]);
    return result.rows[0];
};

exports.forgotPassword = async ({ payload }) => {
    const { email } = payload;
    if (!email) {
        throw new CustomError("Email is required", 400);
    }

    const user = await appUserService.getUserByEmail({ email });
    if (!user) {
        return { success: true };
    }

    const token = uuidv4();
    await exports.savePasswordResetRequest({ email, token });

    await emailService.sendPasswordReset({ to: email, token }).catch(err => {
        console.error("Failed to send reset email:", err);
    });

    return { success: true };
};

exports.resetPassword = async ({ payload }) => {
    const { token, password } = payload;
    if (!token || !password) {
        throw new CustomError("Token and password are required", 400);
    }

    const request = await exports.validateResetToken({ token });
    if (!request) {
        throw new CustomError("Invalid or expired reset token", 400);
    }

    const hashedPassword = await hash(password, 10);
    const updateSql = `UPDATE app_user SET password = $1 WHERE email = $2`;
    await query(updateSql, [hashedPassword, request.email]);

    const markUsedSql = `UPDATE password_reset_requests SET used = true WHERE id = $1`;
    await query(markUsedSql, [request.id]);

    return { success: true };
};
