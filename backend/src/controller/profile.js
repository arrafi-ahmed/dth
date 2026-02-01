const router = require("express").Router();
const { auth } = require("../middleware/auth");
const ApiResponse = require("../model/ApiResponse");
const CustomError = require("../model/CustomError");
const appUserService = require("../service/appUser");
const { hash, compare } = require("bcrypt");
const { query } = require("../db");

const formatUser = (user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
});

router.put("/", auth, async (req, res, next) => {
    try {
        const { fullName, email, newPassword, currentPassword } = req.body;
        const updates = {};

        if (fullName?.trim()) updates.fullName = fullName.trim();
        if (email?.trim()) updates.email = email.trim();
        if (newPassword?.trim()) updates.password = newPassword.trim();

        if (Object.keys(updates).length === 0) {
            throw new CustomError("Provide at least one field to update", 400);
        }

        const user = await appUserService.getUserById({ userId: req.currentUser.id });
        const userWithPassword = await query(`SELECT password FROM app_user WHERE id = $1`, [user.id]);

        if (!currentPassword) {
            throw new CustomError("Current password is required", 400);
        }

        const matches = await compare(currentPassword, userWithPassword.rows[0].password);
        if (!matches) {
            throw new CustomError("Current password is incorrect", 401);
        }

        const updatedUser = await appUserService.updateProfile({
            userId: user.id,
            updates,
        });

        res.status(200).json(new ApiResponse({ msg: "Profile updated successfully", payload: { currentUser: formatUser(updatedUser) } }));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
