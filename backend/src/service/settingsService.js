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
        const [appearance, header, footer, formConfig, pdfSettings] = await Promise.all([
            this.getAppearanceSettings(),
            this.getHeaderSettings(),
            this.getFooterSettings(),
            this.getFormFieldConfigs(),
            this.getPdfSettings()
        ]);

        return {
            appearance,
            header,
            footer,
            formConfig,
            pdfSettings
        };
    }

    // --- Form Field Configuration ---
    async getFormFieldConfigs() {
        const result = await query(`
            SELECT id, type, field_key as "fieldKey", input_type as "inputType", 
                   label, is_visible as "isVisible", is_required as "isRequired", 
                   show_on_pdf as "showOnPdf", display_order as "displayOrder"
            FROM form_field_configs 
            ORDER BY display_order ASC
        `);
        return result.rows;
    }

    async updateFormFieldConfig(id, data) {
        const fields = [];
        const values = [];
        let i = 1;

        const allowedFields = ['label', 'isVisible', 'isRequired', 'showOnPdf', 'displayOrder', 'inputType', 'fieldKey'];

        for (const key of allowedFields) {
            if (data[key] !== undefined) {
                const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                fields.push(`${dbKey} = $${i++}`);
                values.push(data[key]);
            }
        }

        if (fields.length === 0) return null;

        values.push(id);
        const sql = `UPDATE form_field_configs SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
        const result = await query(sql, values);
        return result.rows[0];
    }

    async batchUpdateFormFieldConfigs(configs) {
        const results = [];
        // Using a loop for now; could be optimized with a single transaction wrapper if needed
        for (const config of configs) {
            const { id, ...data } = config;
            if (id) {
                const updated = await this.updateFormFieldConfig(id, data);
                if (updated) results.push(updated);
            }
        }
        return results;
    }

    async createCustomField(data) {
        const sql = `
            INSERT INTO form_field_configs (type, field_key, input_type, label, is_visible, is_required, show_on_pdf, display_order)
            VALUES ('CUSTOM', $1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            data.fieldKey,
            data.inputType || 'TEXT',
            data.label,
            data.isVisible !== false,
            data.isRequired === true,
            data.showOnPdf !== false,
            data.displayOrder || 0
        ];
        const result = await query(sql, values);
        return result.rows[0];
    }

    async deleteCustomField(id) {
        const sql = `DELETE FROM form_field_configs WHERE id = $1 AND type = 'CUSTOM' RETURNING *`;
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    // --- PDF Settings ---
    async getPdfSettings() {
        const result = await query(`
            SELECT id, disclaimer_text as "disclaimerText", support_phone as "supportPhone", 
                   support_email as "supportEmail", logo_height as "logoHeight", 
                   header_title as "headerTitle", qr_code_size as "qrCodeSize",
                   footer_text as "footerText" 
            FROM pdf_settings 
            LIMIT 1
        `);
        return result.rows[0] || {};
    }

    async updatePdfSettings(data) {
        const current = await this.getPdfSettings();
        if (current.id) {
            const fields = [];
            const values = [];
            let i = 1;

            const allowedFields = ['disclaimerText', 'supportPhone', 'supportEmail', 'logoHeight', 'footerText', 'headerTitle', 'qrCodeSize'];
            for (const key of allowedFields) {
                if (data[key] !== undefined) {
                    const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                    fields.push(`${dbKey} = $${i++}`);
                    values.push(data[key]);
                }
            }

            if (fields.length === 0) return current;

            values.push(current.id);
            await query(`UPDATE pdf_settings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values);
        } else {
            const columns = ['disclaimer_text', 'support_phone', 'support_email', 'logo_height', 'footer_text', 'header_title', 'qr_code_size'];
            const placeholders = ['$1', '$2', '$3', '$4', '$5', '$6', '$7'];
            const values = [
                data.disclaimerText || '',
                data.supportPhone || '',
                data.supportEmail || '',
                data.logoHeight || 130,
                data.footerText || '',
                data.headerTitle || 'VEHICLE RELEASE AUTHORIZATION',
                data.qrCodeSize || 120
            ];
            await query(`INSERT INTO pdf_settings (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
        }
        return await this.getPdfSettings();
    }
}

module.exports = new SettingsService();
