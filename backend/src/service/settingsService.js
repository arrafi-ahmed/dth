const { query } = require("../db");

/**
 * Consolidated Settings Service
 */
class SettingsService {
    // --- Appearance Settings ---
    async getAppearanceSettings() {
        const result = await query("SELECT id, default_theme as \"defaultTheme\", light_colors as \"lightColors\", light_variables as \"lightVariables\", dark_colors as \"darkColors\", dark_variables as \"darkVariables\" FROM appearance_settings LIMIT 1");
        return result.rows[0] || {};
    }

    async updateAppearanceSettings(data) {
        const current = await this.getAppearanceSettings();
        if (current.id) {
            await query(
                `UPDATE appearance_settings 
                 SET default_theme = $1, light_colors = $2, light_variables = $3, 
                     dark_colors = $4, dark_variables = $5, updated_at = NOW() 
                 WHERE id = $6`,
                [
                    data.defaultTheme ?? current.defaultTheme,
                    JSON.stringify(data.lightColors || current.lightColors || {}),
                    JSON.stringify(data.lightVariables || current.lightVariables || {}),
                    JSON.stringify(data.darkColors || current.darkColors || {}),
                    JSON.stringify(data.darkVariables || current.darkVariables || {}),
                    current.id
                ]
            );
        } else {
            await query(
                `INSERT INTO appearance_settings 
                 (default_theme, light_colors, light_variables, dark_colors, dark_variables) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    data.defaultTheme || 'dark',
                    JSON.stringify(data.lightColors || {}),
                    JSON.stringify(data.lightVariables || {}),
                    JSON.stringify(data.darkColors || {}),
                    JSON.stringify(data.darkVariables || {})
                ]
            );
        }
        return await this.getAppearanceSettings();
    }

    // --- Footer Settings ---
    async getFooterSettings() {
        const result = await query("SELECT id, style, company_name as \"companyName\", company_address as \"companyAddress\", company_email as \"companyEmail\", company_phone as \"companyPhone\", quick_links as \"quickLinks\", social_links as \"socialLinks\", copyright_text as \"copyrightText\" FROM footer_settings LIMIT 1");
        return result.rows[0] || {};
    }

    async updateFooterSettings(data) {
        const current = await this.getFooterSettings();
        if (current.id) {
            await query(
                `UPDATE footer_settings 
                 SET style = $1, company_name = $2, company_address = $3, 
                     company_email = $4, company_phone = $5, quick_links = $6, 
                     social_links = $7, copyright_text = $8, updated_at = NOW() 
                 WHERE id = $9`,
                [
                    data.style || current.style,
                    data.companyName || current.companyName,
                    data.companyAddress || current.companyAddress,
                    data.companyEmail || current.companyEmail,
                    data.companyPhone || current.companyPhone,
                    JSON.stringify(data.quickLinks || current.quickLinks || []),
                    JSON.stringify(data.socialLinks || current.socialLinks || {}),
                    data.copyrightText || current.copyrightText,
                    current.id
                ]
            );
        } else {
            await query(
                `INSERT INTO footer_settings 
                 (style, company_name, company_address, company_email, company_phone, quick_links, social_links, copyright_text) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    data.style || 'oneline',
                    data.companyName,
                    data.companyAddress,
                    data.companyEmail,
                    data.companyPhone,
                    JSON.stringify(data.quickLinks || []),
                    JSON.stringify(data.socialLinks || {}),
                    data.copyrightText
                ]
            );
        }
        return await this.getFooterSettings();
    }

    // --- Header Settings ---
    async getHeaderSettings() {
        const result = await query("SELECT id, logo_image as \"logoImage\", logo_image_dark as \"logoImageDark\", logo_position as \"logoPosition\", menu_position as \"menuPosition\", logo_width_left as \"logoWidthLeft\", logo_width_center as \"logoWidthCenter\", logo_width_mobile as \"logoWidthMobile\" FROM header_settings LIMIT 1");
        return result.rows[0] || {};
    }

    async updateHeaderSettings(data) {
        const current = await this.getHeaderSettings();
        const fields = [];
        const values = [];
        let i = 1;

        for (const [key, value] of Object.entries(data)) {
            // Convert camelCase to snake_case for DB
            const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            fields.push(`${dbKey} = $${i++}`);
            values.push(value);
        }

        if (current.id) {
            values.push(current.id);
            await query(
                `UPDATE header_settings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
                values
            );
        } else {
            // For insertion, we'd need more logic but let's assume update is primary
            const columns = Object.keys(data).map(k => k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`));
            const placeholders = Object.keys(data).map((_, idx) => `$${idx + 1}`);
            await query(
                `INSERT INTO header_settings (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
                Object.values(data)
            );
        }
        return await this.getHeaderSettings();
    }

    // --- Layout Data ---
    async getAllLayoutData() {
        const [appearance, header, footer] = await Promise.all([
            this.getAppearanceSettings(),
            this.getHeaderSettings(),
            this.getFooterSettings()
        ]);

        return {
            appearance,
            header,
            footer
        };
    }
}

module.exports = new SettingsService();
