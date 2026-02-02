require('dotenv').config({ path: '.env.development' });
const db = require('./src/db');

async function checkFields() {
    try {
        const res = await db.query("SELECT field_key FROM form_field_configs WHERE type = 'CORE'");
        // db.js converts snake_case to camelCase
        console.log("Core Field Keys:", res.rows.map(r => r.fieldKey));
    } catch (err) {
        console.error(err);
    }
    // db module likely manages pool, so just exit
    setTimeout(() => process.exit(0), 1000);
}

checkFields();
