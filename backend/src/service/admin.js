const { query } = require("../db");

exports.getStats = async () => {
    try {
        const userCountSql = `SELECT COUNT(*) FROM app_user`;

        const [userResult] = await Promise.all([
            query(userCountSql)
        ]);

        return {
            users: parseInt(userResult.rows[0].count) || 0,
            orders: 0,
            revenue: 0,
            activeSessions: Math.floor(Math.random() * 50) + 10 // Placeholder for now
        };
    } catch (error) {
        console.error('Error in getStats:', error);
        return {
            users: 0,
            orders: 0,
            revenue: 0,
            activeSessions: 0
        };
    }
};
