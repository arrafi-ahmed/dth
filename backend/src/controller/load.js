const router = require("express").Router();
const loadService = require("../service/load");
const pdfService = require("../service/pdf");
const ApiResponse = require("../model/ApiResponse");
const { auth } = require("../middleware/auth");

/**
 * GET /api/loads/:id/pdf
 * Generate and download vehicle release PDF
 */
router.get("/:id/pdf", auth, async (req, res, next) => {
    try {
        const load = await loadService.getLoadById(req.params.id);
        const timezone = req.currentUser?.timezone || 'UTC';
        const pdfBuffer = await pdfService.generateVehicleReleasePdf(load, timezone);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=DTH_Release_${load.loadId}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/loads
 * List all loads for the Dispatch dashboard
 */
router.get("/", auth, async (req, res, next) => {
    try {
        const loads = await loadService.getLoads();
        res.status(200).json(new ApiResponse({
            payload: loads
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/loads/logs
 * Get all release confirmation logs for the audit dashboard
 */
router.get("/logs", auth, async (req, res, next) => {
    try {
        const logs = await loadService.getReleaseLogs();
        res.status(200).json(new ApiResponse({
            payload: logs
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/loads/:id
 * Get detailed view of a specific load (including PIN)
 */
router.get("/:id", auth, async (req, res, next) => {
    try {
        const load = await loadService.getLoadById(req.params.id);
        res.status(200).json(new ApiResponse({
            payload: load
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/loads
 * Create a new load record
 */
router.post("/", auth, async (req, res, next) => {
    try {
        const newLoad = await loadService.createLoad({
            payload: req.body,
            currentUser: req.currentUser
        });
        res.status(201).json(new ApiResponse({
            msg: "Load created successfully",
            payload: newLoad
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/loads/:id/validate
 * Validate a load record (move from DRAFT to VALID)
 */
router.patch("/:id/validate", auth, async (req, res, next) => {
    try {
        const validatedLoad = await loadService.validateLoad(req.params.id, req.currentUser);
        res.status(200).json(new ApiResponse({
            msg: "Load validated successfully",
            payload: validatedLoad
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/loads/:id/void
 * Void a load record
 */
router.patch("/:id/void", auth, async (req, res, next) => {
    try {
        const voidedLoad = await loadService.voidLoad(req.params.id, req.currentUser);
        res.status(200).json(new ApiResponse({
            msg: "Load voided successfully",
            payload: voidedLoad
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/loads/:id/status
 * Manually update the status of a load
 */
router.patch("/:id/status", auth, async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            throw new CustomError("Status is required", 400);
        }
        const updatedLoad = await loadService.updateStatus(req.params.id, status, req.currentUser);
        res.status(200).json(new ApiResponse({
            msg: `Status updated to ${status}`,
            payload: updatedLoad
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/loads/:id
 * Update all editable fields of a load record
 */
router.put("/:id", auth, async (req, res, next) => {
    try {
        const updatedLoad = await loadService.updateLoad(req.params.id, req.body);
        res.status(200).json(new ApiResponse({
            msg: "Load updated successfully",
            payload: updatedLoad
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/loads/:id
 * Permanently delete a load record
 */
router.delete("/:id", auth, async (req, res, next) => {
    try {
        await loadService.deleteLoad(req.params.id);
        res.status(200).json(new ApiResponse({
            msg: "Load deleted successfully"
        }));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
