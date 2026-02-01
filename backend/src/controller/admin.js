const router = require("express").Router();
const adminService = require("../service/admin");
const ApiResponse = require("../model/ApiResponse");
const { auth, isAdmin } = require("../middleware/auth");

// Get dashboard stats
router.get("/stats", auth, isAdmin, async (req, res, next) => {
    try {
        const stats = await adminService.getStats();
        res.status(200).json(new ApiResponse({ payload: stats }));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
