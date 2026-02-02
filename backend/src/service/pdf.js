const htmlPdf = require("html-pdf-node");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode");
const { getBrandingData } = require("../utils/branding");
const { formatTime } = require("../utils/common");

const templatePath = path.join(__dirname, "..", "templates", "vehicleRelease.html");
const templateSource = fs.readFileSync(templatePath, "utf8");
const compileTemplate = handlebars.compile(templateSource);

/**
 * Generate a PDF buffer for a specific load
 */
exports.generateVehicleReleasePdf = async (load, timezone = 'UTC') => {
    const branding = await getBrandingData();

    // Generate QR Code as Data URL
    // The QR code contains the secure verification URL
    const verificationUrl = `${process.env.VUE_BASE_URL}/verify/${load.verificationToken}`;
    const qrDataUrl = await qrcode.toDataURL(verificationUrl, {
        margin: 1,
        width: 400,
        color: {
            dark: "#000000",
            light: "#ffffff"
        }
    });

    const html = compileTemplate({
        ...branding,
        loadId: load.loadId,
        vehicleYear: load.vehicleYear,
        vehicleMake: load.vehicleMake,
        vehicleModel: load.vehicleModel,
        vinLast6: load.vinLast6,
        carrierName: load.carrierName,
        driverName: load.driverName,
        truckPlate: load.truckPlate,
        trailerPlate: load.trailerPlate,
        pickupWindowStart: load.pickupWindowStart ? formatTime(load.pickupWindowStart, timezone) : "N/A",
        pickupWindowEnd: load.pickupWindowEnd ? formatTime(load.pickupWindowEnd, timezone) : "N/A",
        pickupLocation: load.pickupLocation,
        pickupInfo: load.pickupInfo,
        pickupContact: load.pickupContact,
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
