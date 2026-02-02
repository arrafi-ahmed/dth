const router = require("express").Router();
const loadService = require("../service/load");
const ApiResponse = require("../model/ApiResponse");

/**
 * GET /api/verify/:token
 * Public endpoint triggered by QR scan
 * Returns limited load details and the PIN for verification
 */
router.get("/:token", async (req, res, next) => {
    try {
        const load = await loadService.getLoadByToken(req.params.token);

        // Sanitize response - only send what's needed for the Dealer Verification Page
        const dealerView = {
            loadId: load.loadId,
            pickupLocation: load.pickupLocation,
            vehicle: {
                year: load.vehicleYear,
                make: load.vehicleMake,
                model: load.vehicleModel,
                vinLast6: load.vinLast6
            },
            driver: {
                name: load.driverName
            },
            carrier: {
                name: load.carrierName
            },
            plates: {
                truck: load.truckPlate,
                trailer: load.trailerPlate
            },
            status: load.status,
            pickupWindow: {
                start: load.pickupWindowStart,
                end: load.pickupWindowEnd
            },
            pin: load.pin, // Per requirement: "Pickup PIN (displayed on screen)"
            pickupInfo: load.pickupInfo,
            pickupContact: load.pickupContact
        };

        res.status(200).json(new ApiResponse({
            msg: "Verification details retrieved",
            payload: dealerView
        }));
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/verify/:token/confirm
 * Public endpoint to submit the PIN and confirm release
 */
router.post("/:token/confirm", async (req, res, next) => {
    try {
        const { pin, confirmedBy } = req.body;
        const updatedLoad = await loadService.confirmRelease({
            token: req.params.token,
            pin,
            confirmedBy
        });

        res.status(200).json(new ApiResponse({
            msg: "VEHICLE RELEASE CONFIRMED",
            payload: {
                status: updatedLoad.status,
                confirmationMessage: "This vehicle has been officially released by DTH Logistics."
            }
        }));
    } catch (err) {
        // Map specific logic errors to friendly messages if needed
        next(err);
    }
});

module.exports = router;
