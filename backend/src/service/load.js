const { query } = require("../db");
const CustomError = require("../model/CustomError");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const emailService = require("./email");
const pdfService = require("./pdf");

/**
 * Generate a random numeric PIN of specified length
 */
const generatePIN = (length = 6) => {
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
};

/**
 * Generate a unique Load ID
 */
const generateLoadId = async () => {
    const prefix = "DTH-";
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    const loadId = `${prefix}${random}`;

    // Check for uniqueness
    const result = await query("SELECT id FROM loads WHERE load_id = $1", [loadId]);
    if (result.rowCount > 0) {
        return generateLoadId(); // Recurse if collision
    }
    return loadId;
};

/**
 * Log an action for a specific load
 */
const logAction = async ({ loadId, action, details = {}, userId = null }) => {
    const sql = `
        INSERT INTO load_logs (load_id, action, details, user_id)
        VALUES ($1, $2, $3, $4)
    `;
    await query(sql, [loadId, action, JSON.stringify(details), userId]);
};

exports.getLoads = async () => {
    const sql = `SELECT * FROM loads ORDER BY created_at DESC`;
    const result = await query(sql);
    return result.rows;
};

exports.getLoadById = async (id) => {
    const sql = `SELECT * FROM loads WHERE id = $1`;
    const result = await query(sql, [id]);
    if (result.rowCount === 0) {
        throw new CustomError("Load not found", 404);
    }

    const load = result.rows[0];

    // Fetch confirmation details if available
    if (load.status === 'USED') {
        const logSql = `
            SELECT details->>'confirmedBy' as "confirmedBy", created_at as "timestamp"
            FROM load_logs 
            WHERE load_id = $1 AND action = 'RELEASE_CONFIRMED'
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const logResult = await query(logSql, [id]);
        if (logResult.rowCount > 0) {
            load.confirmation = logResult.rows[0];
        }
    }

    return load;
};

exports.getLoadByToken = async (token) => {
    const sql = `
        SELECT l.*, u.email as "dispatcherEmail", u.full_name as "dispatcherName"
        FROM loads l
        LEFT JOIN app_user u ON l.created_by = u.id
        WHERE l.verification_token = $1
    `;
    const result = await query(sql, [token]);
    if (result.rowCount === 0) {
        throw new CustomError("Invalid verification link", 404);
    }
    return result.rows[0];
};

exports.createLoad = async ({ payload, currentUser }) => {
    const {
        pickupLocation,
        vehicleYear,
        vehicleMake,
        vehicleModel,
        vinLast6,
        carrierName,
        driverName,
        driverLicenseInfo,
        driverPhoto,
        truckPlate,
        trailerPlate,
        pickupWindowStart,
        pickupWindowEnd,
        pickupInfo,
        pickupContact,
        loadId: customLoadId,
        customFields
    } = payload;

    const loadId = customLoadId || await generateLoadId();
    const pin = generatePIN();
    const token = uuidv4();

    const sql = `
        INSERT INTO loads (
            load_id, pickup_location, vehicle_year, vehicle_make, vehicle_model, 
            vin_last_6, carrier_name, driver_name, driver_license_info, 
            driver_photo, truck_plate, trailer_plate, pickup_window_start, 
            pickup_window_end, pin, verification_token, status, created_by,
            pickup_info, pickup_contact, custom_fields
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'DRAFT', $17, $18, $19, $20)
        RETURNING *
    `;

    const values = [
        loadId, pickupLocation, vehicleYear, vehicleMake, vehicleModel,
        vinLast6, carrierName, driverName, driverLicenseInfo,
        driverPhoto, truckPlate, trailerPlate, pickupWindowStart,
        pickupWindowEnd, pin, token, currentUser?.id,
        pickupInfo, pickupContact, JSON.stringify(customFields || {})
    ];

    const result = await query(sql, values);
    const newLoad = result.rows[0];

    // Email PDF to creator (dispatcher)
    if (currentUser && currentUser.email) {
        const vehicleInfo = `${newLoad.vehicleYear || ''} ${newLoad.vehicleMake || ''} ${newLoad.vehicleModel || ''}`.trim() || newLoad.vinLast6 || 'Vehicle';

        // Generate PDF and send email
        pdfService.generateVehicleReleasePdf(newLoad)
            .then(pdfBuffer => {
                return emailService.sendLoadValidationNotification({
                    loadId: newLoad.loadId,
                    vehicleInfo,
                    pdfBuffer,
                    to: currentUser.email,
                    subject: `Load Created: ${newLoad.loadId} - DTH Logistics`
                });
            })
            .catch(err => console.error("Failed to email PDF to creator:", err));
    }

    // No logging here as per user request (only successful release)
    return newLoad;
};

exports.updateLoad = async (id, payload) => {
    const {
        pickupLocation,
        vehicleYear,
        vehicleMake,
        vehicleModel,
        vinLast6,
        carrierName,
        driverName,
        driverLicenseInfo,
        truckPlate,
        trailerPlate,
        pickupWindowStart,
        pickupWindowEnd,
        pickupInfo,
        pickupContact,
        loadId,
        customFields
    } = payload;

    const sql = `
        UPDATE loads 
        SET 
            pickup_location = $1, 
            vehicle_year = $2, 
            vehicle_make = $3, 
            vehicle_model = $4, 
            vin_last_6 = $5, 
            carrier_name = $6, 
            driver_name = $7, 
            driver_license_info = $8, 
            truck_plate = $9, 
            trailer_plate = $10, 
            pickup_window_start = $11, 
            pickup_window_end = $12,
            pickup_info = $13,
            pickup_contact = $14,
            load_id = $15,
            custom_fields = $16,
            updated_at = NOW()
        WHERE id = $17
        RETURNING *
    `;

    const values = [
        pickupLocation, vehicleYear, vehicleMake, vehicleModel,
        vinLast6, carrierName, driverName, driverLicenseInfo,
        truckPlate, trailerPlate, pickupWindowStart,
        pickupWindowEnd, pickupInfo, pickupContact, loadId,
        JSON.stringify(customFields || {}),
        id
    ];

    const result = await query(sql, values);
    if (result.rowCount === 0) {
        throw new CustomError("Load not found", 404);
    }

    return result.rows[0];
};

exports.updateStatus = async (id, status, currentUser) => {
    const sql = `UPDATE loads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [status, id]);
    if (result.rowCount === 0) {
        throw new CustomError("Load not found", 404);
    }

    // No logging here as per user request (only successful release)
    return result.rows[0];
};

exports.confirmRelease = async ({ token, pin, confirmedBy }) => {
    const load = await exports.getLoadByToken(token);

    if (load.status === "USED") {
        throw new CustomError("ALREADY USED", 400);
    }

    if (load.status !== "VALID") {
        throw new CustomError("DO NOT RELEASE - Status is not VALID", 400);
    }

    // Check pickup window
    const now = new Date();
    if (load.pickupWindowStart && now < new Date(load.pickupWindowStart)) {
        const startTime = new Date(load.pickupWindowStart).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        throw new CustomError(`LOAD NOT YET ACTIVE - Pickup window starts at ${startTime}`, 400);
    }
    if (load.pickupWindowEnd && now > new Date(load.pickupWindowEnd)) {
        throw new CustomError("LOAD EXPIRED", 400);
    }

    // Validate PIN
    if (load.pin !== pin) {
        // No logging here as per user request (only successful release)
        throw new CustomError("INVALID PIN", 400);
    }

    // Success - Update status
    const updateSql = `UPDATE loads SET status = 'USED', updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(updateSql, [load.id]);
    const updatedLoad = result.rows[0];

    await logAction({
        loadId: load.id,
        action: "RELEASE_CONFIRMED",
        details: { confirmedBy, timestamp: now },
        userId: null // Public action
    });

    // Send email notification to dispatcher
    if (load.dispatcherEmail) {
        const vehicleInfo = `${load.vehicleYear || ''} ${load.vehicleMake || ''} ${load.vehicleModel || ''}`.trim() || load.vinLast6 || 'Vehicle';

        // Generate PDF for attachment
        let attachments = [];
        try {
            const pdfBuffer = await pdfService.generateVehicleReleasePdf(updatedLoad);
            attachments.push({
                filename: `DTH_Release_${load.loadId}.pdf`,
                content: pdfBuffer
            });
        } catch (pdfErr) {
            console.error("Failed to generate PDF for release attachment:", pdfErr);
        }

        emailService.sendReleaseNotification({
            to: load.dispatcherEmail,
            dispatcherName: load.dispatcherName || 'Dispatcher',
            loadId: load.loadId,
            vehicleInfo,
            confirmedBy,
            pickupLocation: load.pickupLocation || load.pickup_location, // Added pickupLocation
            timestamp: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
            attachments
        }).catch(err => console.error("Failed to send release notification:", err));
    }

    return updatedLoad;
};

exports.validateLoad = async (id, currentUser) => {
    const sql = `UPDATE loads SET status = 'VALID', updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    if (result.rowCount === 0) {
        throw new CustomError("Load not found", 404);
    }

    // No logging here as per user request (only successful release)
    const validatedLoad = result.rows[0];

    // Automatically email PDF to generic dispatch
    const vehicleInfo = `${validatedLoad.vehicle_year || ''} ${validatedLoad.vehicle_make || ''} ${validatedLoad.vehicle_model || ''}`.trim() || validatedLoad.vin_last_6 || 'Vehicle';

    pdfService.generateVehicleReleasePdf(validatedLoad)
        .then(pdfBuffer => {
            return emailService.sendLoadValidationNotification({
                loadId: validatedLoad.load_id,
                vehicleInfo,
                pdfBuffer
            });
        })
        .catch(err => console.error("Failed to send validation email:", err));

    return validatedLoad;
};

exports.voidLoad = async (id, currentUser) => {
    const sql = `UPDATE loads SET status = 'VOID', updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    if (result.rowCount === 0) {
        throw new CustomError("Load not found", 404);
    }

    // No logging here as per user request (only successful release)
    return result.rows[0];
};
exports.deleteLoad = async (id) => {
    // Transaction-like deletion (though not explicit here, we delete logs first usually)
    // Actually, if we have foreign keys with ON DELETE CASCADE, it's easier.
    // Let's check schema later if needed, for now just simple delete.
    await query("DELETE FROM load_logs WHERE load_id = $1", [id]);
    const sql = `DELETE FROM loads WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    if (result.rowCount === 0) {
        throw new CustomError("Load not found", 404);
    }
    return result.rows[0];
};
exports.getReleaseLogs = async () => {
    const sql = `
        SELECT 
            ll.id,
            l.load_id as "loadId",
            l.id as "loadRawId",
            l.pickup_location as "pickupLocation",
            ll.details->>'confirmedBy' as "confirmedBy",
            ll.created_at as "timestamp"
        FROM load_logs ll
        JOIN loads l ON ll.load_id = l.id
        WHERE ll.action = 'RELEASE_CONFIRMED'
        ORDER BY ll.created_at DESC
    `;
    const result = await query(sql);
    return result.rows;
};
