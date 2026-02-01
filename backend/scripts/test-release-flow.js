require("dotenv").config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development",
});

const loadService = require("../src/service/load");
const { pool } = require("../src/db");

async function runTest() {
    console.log("🚀 Starting Vehicle Release Flow Integration Test...");

    try {
        // 1. Create a Load
        console.log("\nStep 1: Creating a new load...");
        const payload = {
            dealerName: "Test Dealership",
            vehicleYear: 2024,
            vehicleMake: "Tesla",
            vehicleModel: "Model 3",
            vinLast6: "123456",
            carrierName: "Fast Logix",
            driverName: "John Doe",
            driverLicenseInfo: "DL-99999",
            truckPlate: "TRK-123",
            trailerPlate: "TRL-456",
            pickupWindowStart: new Date(Date.now() - 3600000), // 1 hour ago
            pickupWindowEnd: new Date(Date.now() + 3600000)   // 1 hour from now
        };

        const load = await loadService.createLoad({ payload, currentUser: { id: 1 } });
        console.log(`✅ Load created: ${load.loadId} (Internal ID: ${load.id})`);
        console.log(`🔑 Generated PIN: ${load.pin}`);
        console.log(`🔗 Verification Token: ${load.verificationToken}`);

        // 2. Simulate Dealer Scan (Fetch by Token)
        console.log("\nStep 2: Simulating dealer scan (fetching by token)...");
        const dealerLoad = await loadService.getLoadByToken(load.verificationToken);
        if (dealerLoad.loadId === load.loadId) {
            console.log("✅ Successfully retrieved load details via token.");
        } else {
            throw new Error("Load ID mismatch after token lookup!");
        }

        // 3. Attempt Incorrect PIN
        console.log("\nStep 3: Attempting release with INCORRECT PIN...");
        try {
            await loadService.confirmRelease({
                token: load.verificationToken,
                pin: "000000",
                dealerName: "John's Tesla Shop"
            });
            console.log("❌ Error: Release should have failed with wrong PIN!");
        } catch (err) {
            console.log(`✅ Successfully blocked incorrect PIN: ${err.message}`);
        }

        // 4. Attempt Correct PIN
        console.log("\nStep 4: Attempting release with CORRECT PIN...");
        const confirmedLoad = await loadService.confirmRelease({
            token: load.verificationToken,
            pin: load.pin,
            dealerName: "John's Tesla Shop"
        });

        if (confirmedLoad.status === "USED") {
            console.log("✅ Successfully confirmed release! Status is now USED.");
        } else {
            throw new Error(`Unexpected status after confirmation: ${confirmedLoad.status}`);
        }

        // 5. Verify One-Time Use (Attempt Reuse)
        console.log("\nStep 5: Verifying one-time use (attempting reuse)...");
        try {
            await loadService.confirmRelease({
                token: load.verificationToken,
                pin: load.pin,
                dealerName: "John's Tesla Shop"
            });
            console.log("❌ Error: Release should have been blocked (ALREADY USED)!");
        } catch (err) {
            console.log(`✅ Successfully blocked reuse: ${err.message}`);
        }

        console.log("\n✨ All integration tests passed!");

    } catch (error) {
        console.error("\n❌ Test Failed:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runTest();
