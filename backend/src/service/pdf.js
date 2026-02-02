const htmlPdf = require("html-pdf-node");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode");
const { getBrandingData } = require("../utils/branding");
const { formatTime } = require("../utils/common");
const settingsService = require("./settingsService");

const templatePath = path.join(__dirname, "..", "templates", "vehicleRelease.html");
const templateSource = fs.readFileSync(templatePath, "utf8");
const compileTemplate = handlebars.compile(templateSource);

/**
 * Generate a PDF buffer for a specific load
 */
exports.generateVehicleReleasePdf = async (load, timezone = 'UTC') => {
    const [branding, formConfigs, pdfSettings] = await Promise.all([
        getBrandingData(),
        settingsService.getFormFieldConfigs(),
        settingsService.getPdfSettings()
    ]);

    // Generate QR Code
    // Ensure verificationToken is accessed correctly (camelCase from db wrapper)
    const token = load.verificationToken || load.verification_token;
    const verificationUrl = `${process.env.VUE_BASE_URL}/verify/${token}`;
    const qrDataUrl = await qrcode.toDataURL(verificationUrl, {
        margin: 1,
        width: pdfSettings.qrCodeSize || 120,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });

    // Prepare dynamic fields data
    const fields = {};
    const visibleOnPdf = formConfigs.filter(f => f.showOnPdf);

    // Map camelCase keys to database snake_case columns
    const keyMap = {
        loadId: 'load_id',
        pickupLocation: 'pickup_location',
        vehicleYear: 'vehicle_year',
        vehicleMake: 'vehicle_make',
        vehicleModel: 'vehicle_model',
        vinLast6: 'vin_last_6',
        carrierName: 'carrier_name',
        driverName: 'driver_name',
        driverLicenseInfo: 'driver_license_info',
        driverPhoto: 'driver_photo',
        truckPlate: 'truck_plate',
        trailerPlate: 'trailer_plate',
        pickupWindowStart: 'pickup_window_start',
        pickupWindowEnd: 'pickup_window_end',
        pickupInfo: 'pickup_info',
        pickupContact: 'pickup_contact'
    };

    // Map core fields if visible on PDF
    visibleOnPdf.forEach(config => {
        if (config.type === 'CORE') {
            // Try to find value using the key map (snake_case) or fallback to direct access (camelCase)
            let value = load[keyMap[config.fieldKey]] || load[config.fieldKey];

            if (config.fieldKey === 'pickupWindowStart' || config.fieldKey === 'pickupWindowEnd') {
                value = value ? formatTime(value, timezone) : "N/A";
            }
            fields[config.fieldKey] = {
                label: config.label,
                value: value,
                isVisible: true
            };
        }
    });

    // Handle custom fields
    const customFieldsListData = [];
    // Ensure customFields exists (it's camelCase due to db.js wrapper)
    let customFieldsObj = load.customFields || load.custom_fields || {};

    // Handle stringified JSON if necessary (though db wrapper might handle it, safeguard here)
    if (typeof customFieldsObj === 'string') {
        try {
            customFieldsObj = JSON.parse(customFieldsObj);
        } catch (e) {
            console.error('[PDF] Error parsing customFields:', e);
            customFieldsObj = {};
        }
    }

    // console.log('[PDF] Processing custom fields:', Object.keys(customFieldsObj));

    visibleOnPdf.filter(f => f.type === 'CUSTOM').forEach(config => {
        const value = customFieldsObj[config.fieldKey];
        if (value) {
            customFieldsListData.push({
                label: config.label,
                value: value
            });
        }
    });

    const html = compileTemplate({
        ...branding,
        ...pdfSettings,
        headerTitle: pdfSettings.headerTitle || 'VEHICLE RELEASE AUTHORIZATION',
        qrCodeSize: pdfSettings.qrCodeSize || 120,
        logoHeightCss: pdfSettings.logoHeight ? `${pdfSettings.logoHeight}px` : '130px',
        qrCodeSizeCss: (pdfSettings.qrCodeSize || 120) + 'px',
        fields,
        customFields: customFieldsListData,
        qrDataUrl
    });

    console.log("[PDF DEBUG] Generated HTML snippet (first 1000 chars):", html.substring(0, 1000));

    const file = { content: html };
    const options = {
        format: "A4",
        margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
        printBackground: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
    };

    return await htmlPdf.generatePdf(file, options);
};
