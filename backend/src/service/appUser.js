const { query } = require("../db");
const CustomError = require("../model/CustomError");
const { hash } = require("bcrypt");

exports.save = async ({ payload }) => {
    if (!payload) {
        throw new CustomError("Payload is required", 400);
    }

    const { id, ...userData } = payload;

    if (!userData.email || !userData.email.trim()) {
        throw new CustomError("Email is required", 400);
    }

    const role = userData.role ? parseInt(userData.role, 10) : 40; // Default to attendee/user
    if (![20, 40].includes(role)) {
        throw new CustomError("Invalid role! Supported roles are admin (20) and user (40).", 400);
    }

    userData.role = role;

    try {
        if (id) {
            let hashedPassword = null;
            if (userData.password && userData.password.trim()) {
                hashedPassword = await hash(userData.password, 10);
            }

            const fields = [
                'full_name = $2',
                'email = $3',
                'role = $4'
            ];
            const values = [
                id,
                userData.fullName,
                userData.email,
                userData.role
            ];

            let paramIndex = 5;
            if (hashedPassword) {
                fields.push(`password = $${paramIndex}`);
                values.push(hashedPassword);
            }

            const sql = `
                UPDATE app_user
                SET ${fields.join(', ')}
                WHERE id = $1
                RETURNING id, full_name as "fullName", email, role, created_at as "createdAt"
            `;

            const result = await query(sql, values);
            if (!result.rows[0]) {
                throw new CustomError("User not found", 404);
            }
            return result.rows[0];

        } else {
            if (!userData.password || !userData.password.trim()) {
                throw new CustomError("Password is required for new users", 400);
            }

            const hashedPassword = await hash(userData.password, 10);

            const sql = `
                INSERT INTO app_user (full_name, email, password, role, created_at)
                VALUES ($1, $2, $3, $4, NOW()) 
                RETURNING id, full_name as "fullName", email, role, created_at as "createdAt"
            `;
            const values = [
                userData.fullName,
                userData.email,
                hashedPassword,
                userData.role,
            ];
            const result = await query(sql, values);
            return result.rows[0];
        }
    } catch (err) {
        if (err.code === "23505") {
            throw new CustomError("Email already in use", 400);
        }
        throw err;
    }
};

exports.getUserByEmail = async ({ email }) => {
    const sql = `SELECT id, full_name as "fullName", email, password, role FROM app_user WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows[0];
};

exports.getUserById = async ({ userId }) => {
    const sql = `SELECT id, full_name as "fullName", email, role FROM app_user WHERE id = $1`;
    const result = await query(sql, [userId]);
    if (!result.rows[0]) throw new CustomError("User not found", 404);
    return result.rows[0];
};

exports.updateProfile = async ({ userId, updates }) => {
    const fields = [];
    const values = [];
    let index = 1;

    if (updates.fullName) {
        fields.push(`full_name = $${index++}`);
        values.push(updates.fullName);
    }

    if (updates.email) {
        fields.push(`email = $${index++}`);
        values.push(updates.email);
    }

    if (updates.password) {
        const hashedPassword = await hash(updates.password, 10);
        fields.push(`password = $${index++}`);
        values.push(hashedPassword);
    }

    if (fields.length === 0) throw new CustomError("No valid fields to update", 400);

    values.push(userId);
    const sql = `
        UPDATE app_user
        SET ${fields.join(", ")}
        WHERE id = $${index}
        RETURNING id, full_name as "fullName", email, role
    `;

    const result = await query(sql, values);
    if (!result.rows[0]) throw new CustomError("User not found", 404);
    return result.rows[0];
};
