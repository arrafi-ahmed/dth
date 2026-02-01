const router = require("express").Router();
const settingsService = require("../service/settingsService");
const ApiResponse = require("../model/ApiResponse");
const { auth, isAdmin } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const fs = require("fs");

// --- Appearance Settings ---

// Get appearance settings (public endpoint)
router.get("/appearance", async (req, res, next) => {
    try {
        const settings = await settingsService.getAppearanceSettings();
        res.status(200).json(new ApiResponse({ payload: { settings } }));
    } catch (err) {
        next(err);
    }
});

// Update appearance settings (admin only)
router.put("/appearance", auth, isAdmin, async (req, res, next) => {
    try {
        const {
            defaultTheme,
            lightColors,
            lightVariables,
            darkColors,
            darkVariables
        } = req.body;

        const settings = await settingsService.updateAppearanceSettings({
            defaultTheme,
            lightColors,
            lightVariables,
            darkColors,
            darkVariables
        });

        res.status(200).json(new ApiResponse({ msg: "Appearance settings updated successfully!", payload: { settings } }));
    } catch (err) {
        next(err);
    }
});

// --- Footer Settings ---

// Get footer settings (public endpoint)
router.get("/footer", async (req, res, next) => {
    try {
        const settings = await settingsService.getFooterSettings();
        res.status(200).json(new ApiResponse({ payload: { settings } }));
    } catch (err) {
        next(err);
    }
});

// Update footer settings (admin only)
router.put("/footer", auth, isAdmin, async (req, res, next) => {
    try {
        const {
            style,
            companyName,
            companyAddress,
            companyEmail,
            companyPhone,
            quickLinks,
            socialLinks,
            copyrightText
        } = req.body;

        const settings = await settingsService.updateFooterSettings({
            style,
            companyName,
            companyAddress,
            companyEmail,
            companyPhone,
            quickLinks,
            socialLinks,
            copyrightText
        });

        res.status(200).json(new ApiResponse({ msg: "Footer settings updated successfully!", payload: { settings } }));
    } catch (err) {
        next(err);
    }
});

// --- Header Settings ---

// Get header settings (public endpoint)
router.get("/header", async (req, res, next) => {
    try {
        const settings = await settingsService.getHeaderSettings();
        res.status(200).json(new ApiResponse({ payload: { settings } }));
    } catch (err) {
        next(err);
    }
});

// Update header settings (admin only)
router.put("/header", auth, isAdmin, upload("header"), async (req, res, next) => {
    try {
        const {
            logoPosition,
            menuPosition,
            logoWidthLeft,
            logoWidthCenter,
            logoWidthMobile
        } = req.body;

        const updateData = {};
        if (logoPosition !== undefined) updateData.logoPosition = logoPosition;
        if (menuPosition !== undefined) updateData.menuPosition = menuPosition;
        if (logoWidthLeft !== undefined) updateData.logoWidthLeft = parseInt(logoWidthLeft);
        if (logoWidthCenter !== undefined) updateData.logoWidthCenter = parseInt(logoWidthCenter);
        if (logoWidthMobile !== undefined) updateData.logoWidthMobile = parseInt(logoWidthMobile);

        if (req.processedFiles) {
            if (req.processedFiles.logoImage) {
                updateData.logoImage = req.processedFiles.logoImage.filename;
            }
            if (req.processedFiles.logoImageDark) {
                updateData.logoImageDark = req.processedFiles.logoImageDark.filename;
            }
        }

        const settings = await settingsService.updateHeaderSettings(updateData);

        res.status(200).json(new ApiResponse({ msg: "Header settings updated successfully!", payload: { settings } }));
    } catch (err) {
        if (req.processedFiles) {
            Object.values(req.processedFiles).forEach(file => {
                try { fs.unlinkSync(file.path); } catch (e) { }
            });
        }
        next(err);
    }
});

// --- Layout Data ---

// Get all layout data in a single call (public endpoint)
router.get("/layout", async (req, res, next) => {
    try {
        const layoutData = await settingsService.getAllLayoutData();
        res.status(200).json(new ApiResponse({ payload: layoutData }));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
