const router = require("express").Router();
const appUserService = require("../service/appUser");
const ApiResponse = require("../model/ApiResponse");
const { auth, isAdmin } = require("../middleware/auth");

router.post("/save", auth, isAdmin, async (req, res, next) => {
    try {
        const result = await appUserService.save({
            payload: req.body,
        });
        res.status(200).json(new ApiResponse({ msg: "User saved!", payload: result }));
    } catch (err) {
        next(err);
    }
});

// Delete user - for admins
router.delete("/:id", auth, isAdmin, async (req, res, next) => {
    try {
        const result = await appUserService.deleteUserById({
            userId: req.params.id,
        });
        res.status(200).json(new ApiResponse({ msg: "User deleted!", payload: { deletedCount: result } }));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
