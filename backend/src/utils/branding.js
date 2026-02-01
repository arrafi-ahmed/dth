const settingsService = require("../service/settingsService");
const { getApiPublicImgUrl, appInfo } = require("./common");

/**
 * Fetches standardized branding and header data for system templates (Emails, PDFs, Badges).
 */
async function getBrandingData() {
    try {
        const settings = await settingsService.getHeaderSettings();
        const appearance = await settingsService.getAppearanceSettings();

        // Use the new DTH logo as the primary logo, fallback to settings if needed
        let logoUrl = getApiPublicImgUrl('dth-logo.png', 'header-logo');
        let logoDarkUrl = null;

        if (settings.logoImageDark) {
            logoDarkUrl = getApiPublicImgUrl(settings.logoImageDark, 'header-logo');
        }

        return {
            logo: logoUrl, // Force DTH logo for PDFs/Emails
            logoLight: logoUrl,
            logoDark: logoDarkUrl || logoUrl,
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
