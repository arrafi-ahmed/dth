const { query } = require("./src/db");

async function updateLogo() {
    try {
        const result = await query("SELECT id FROM header_settings LIMIT 1");
        if (result.rows.length > 0) {
            await query("UPDATE header_settings SET logo_image = $1 WHERE id = $2", ["dth-logo.png", result.rows[0].id]);
            console.log("Logo updated successfully");
        } else {
            await query("INSERT INTO header_settings (logo_image) VALUES ($1)", ["dth-logo.png"]);
            console.log("Logo inserted successfully");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateLogo();
