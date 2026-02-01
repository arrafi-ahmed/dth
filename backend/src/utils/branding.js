const settingsService = require("../service/settingsService");
const { getApiPublicImgUrl, appInfo, getBase64Image, getFilePath } = require("./common");

/**
 * Fetches standardized branding and header data for system templates (Emails, PDFs, Badges).
 */
async function getBrandingData() {
    try {
        const settings = await settingsService.getHeaderSettings();
        const appearance = await settingsService.getAppearanceSettings();

        // Use the new DTH logo as the primary logo, fallback to settings if needed
        let logoUrl = getApiPublicImgUrl('logo-full.png', 'header-logo');
        const logoPath = path.join(__dirname, "..", "..", "public", "header-logo", "logo-full.png");
        console.log("[BRANDING] Attempting to encode logo from:", logoPath);
        const logoBase64 = await getBase64Image(logoPath);

        let logoDarkUrl = null;
        let logoDarkBase64 = null;

        if (settings.logoImageDark) {
            logoDarkUrl = getApiPublicImgUrl(settings.logoImageDark, 'header-logo');
            const logoDarkPath = getFilePath(settings.logoImageDark, 'headerLogo');
            logoDarkBase64 = await getBase64Image(logoDarkPath);
        }

        console.log("[BRANDING] Logo Base64 generated:", !!logoBase64);

        return {
            logo: logoUrl, // Force DTH logo for PDFs/Emails
            logoBase64: logoBase64 || logoUrl,
            logoLight: logoUrl,
            logoDark: logoDarkUrl || logoUrl,
            logoDarkBase64: logoDarkBase64 || logoBase64 || logoUrl,
            logoPosition: settings.logoPosition || 'left',
            appName: appInfo.name || 'Ticketi',
            primaryColor: appearance?.lightColors?.primary || '#ED2939'
        };
    } catch (error) {
        console.error("Error fetching branding data:", error);
        return {
            logo: null,
            logoPosition: 'left',
            appName: appInfo.name || 'Ticketi',
            primaryColor: '#ED2939'
        };
    }
}

module.exports = {
    getBrandingData
};
