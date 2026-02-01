const fs = require("fs").promises;
const path = require("path");
const qr = require("qrcode");
const { API_BASE_URL, VUE_BASE_URL, ANDROID_BASE_URL, NODE_ENV } = process.env;

const appInfo = { name: "DTH Logistics", version: 1.0 };

const excludedSecurityURLs = [];

// HTTP Status Codes
const HTTP_STATUS = {
    TOKEN_EXPIRED: 440, // Login Time-out (custom status for token expiry)
    UNAUTHORIZED: 401,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500
};

const isProd = NODE_ENV === "production";
const ifAdmin = (role) => Number(role) === 20;

const formatTime = (inputTime, timezone = 'UTC') => {
    if (!inputTime) return "N/A";
    try {
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: timezone
        };
        // Use en-GB to get DD/MM/YYYY format
        return new Intl.DateTimeFormat('en-GB', options).format(new Date(inputTime)).replace(',', '');
    } catch (e) {
        console.error("Error formatting time:", e);
        return new Date(inputTime).toISOString();
    }
};

const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    const day = `0${date.getDate()}`.slice(-2);
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

function formatDateToMonDD(date) {
    const d = new Date(date); // parse string to Date
    const options = { month: "short", day: "2-digit" };
    return d.toLocaleDateString("en-US", options);
}


const getApiPublicImgUrl = (imageName, type) =>
    `${API_BASE_URL}/${type}/${imageName}`;


const moveImage = (sourcePath, destinationPath) => {
    return new Promise((resolve, reject) => {
        fs.rename(sourcePath, destinationPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

const dirMap = {
    tmp: path.join(__dirname, "..", "..", "public", "tmp"),
    user: path.join(__dirname, "..", "..", "public", "user"),
    headerLogo: path.join(__dirname, "..", "..", "public", "header-logo"),
};

const getPrefix = (filename) => {
    return filename.split("-")[0];
};

const getDirPath = (prefix) => {
    return dirMap[prefix];
};

const getFilePath = (filename, prefix) => {
    const calcPrefix = prefix || getPrefix(filename);
    return path.join(dirMap[calcPrefix], filename);
};

const removeImages = async (imageArr) => {
    if (!Array.isArray(imageArr) || imageArr.length === 0) {
        return [];
    }

    const deletionResults = await Promise.all(
        imageArr.map(async (image) => {
            const filePath = getFilePath(image);
            if (!filePath) {
                console.error("Invalid file path for image:", image);
                return false;
            }

            try {
                await fs.unlink(filePath);
                return true;
            } catch (error) {
                console.error(`Failed to delete file: ${filePath}. Error:`, error);
                return false;
            }
        }),
    );

    return deletionResults; // Array of booleans
};

// const logoSvgString = fsSync.readFileSync(
//   path.join(__dirname, "./logo.svg"),
//   "utf8"
// );

const getCurrencySymbol = ({ code, type }) => {
    const codeLower = code.toString().toLowerCase();

    const currencyMap = {
        usd: { icon: "mdi-currency-usd", symbol: "$", code: "usd" },
        gbp: { icon: "mdi-currency-gbp", symbol: "£", code: "gbp" },
        eur: { icon: "mdi-currency-eur", symbol: "€", code: "eur" },
        thb: { icon: "mdi-currency-thb", symbol: "฿", code: "thb" },
        gnf: { icon: "mdi-currency-cash", symbol: "FG", code: "gnf" },
        xof: { icon: "mdi-currency-cash", symbol: "CFA", code: "xof" },
    };

    const currencyData = currencyMap[codeLower];
    if (!currencyData) {
        return null; // Or undefined, or throw an error, depending on your desired behavior
    }
    if (type === undefined) {
        return currencyData;
    }
    return currencyData[type];
};

const defaultCurrency = getCurrencySymbol({ code: "usd" });



const generatePassword = (length = 8) => {
    const charset =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/()-*&^%$#@!";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

const isBcryptHash = (hash) => {
    // Regex for bcrypt hash: $2a$ or $2b$, followed by cost factor, salt, and hash
    const bcryptRegex = /^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/;
    return bcryptRegex.test(hash);
};

/**
 * Get the ratio to convert from major currency units to minor units (e.g., dollars to cents)
 * @param {string} currency - Currency code (USD, EUR, GBP, etc.)
 * @returns {number} Conversion ratio (100 for most currencies, 1 for currencies without minor units)
 */
function getCurrencyMinorUnitRatio(currency) {
    const currencyMap = {
        usd: 100,
        eur: 100,
        gbp: 100,
        cad: 100,
        aud: 100,
        chf: 100,
        jpy: 1, // Japanese Yen has no minor unit
        krw: 1, // South Korean Won has no minor unit
        cny: 100,
        inr: 100,
        brl: 100,
        mxn: 100,
        sek: 100,
        nok: 100,
        dkk: 100,
        pln: 100,
        czk: 100,
        huf: 1, // Hungarian Forint has no minor unit
        rub: 100,
        try: 100,
        zar: 100,
        nzd: 100,
        sgd: 100,
        hkd: 100,
        thb: 100,
        myr: 100,
        php: 100,
        idr: 100,
        vnd: 1, // Vietnamese Dong has no minor unit
        gnf: 1, // Guinean Franc is zero-decimal
        xof: 1, // West African CFA is zero-decimal
        xaf: 1, // Central African CFA is zero-decimal
        ouv: 1, // Sandbox currency for Orange Money (often used for zero-decimal simulations)
    };

    return currencyMap[currency.toLowerCase()] || 100; // Default to 100 for unknown currencies
}

const generateSessionId = () => {
    // 15 bytes = 30 hex characters
    return require('crypto').randomBytes(15).toString('hex');
};

/**
 * Converts a local image file to a Base64 Data URL
 * @param {string} filePath - Absolute path to the image file
 * @returns {Promise<string|null>} Base64 Data URL or null if error
 */
const getBase64Image = async (filePath) => {
    try {
        const data = await fs.readFile(filePath);
        const extension = path.extname(filePath).replace('.', '');
        const mimeType = extension === 'svg' ? 'image/svg+xml' : `image/${extension}`;
        return `data:${mimeType};base64,${data.toString('base64')}`;
    } catch (error) {
        console.error("Error reading image for base64:", error);
        return null;
    }
};

module.exports = {
    API_BASE_URL,
    VUE_BASE_URL,
    ANDROID_BASE_URL,
    dirMap,
    appInfo,
    getApiPublicImgUrl,
    getFilePath,
    getBase64Image,
    formatTime,
    ifAdmin,
    excludedSecurityURLs,
    formatDateToMonDD,
    generatePassword,
    isBcryptHash,
    defaultCurrency,
    HTTP_STATUS,
    getCurrencyMinorUnitRatio,
    generateSessionId,
};
