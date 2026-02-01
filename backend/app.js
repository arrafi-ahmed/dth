require("dotenv").config({
    path:
        process.env.NODE_ENV === "production"
            ? ".env.production"
            : ".env.development",
});
process.env.TZ = "UTC";

const express = require("express");
const app = express();
const path = require("path");

const customHelmet = require("./src/middleware/customHelmet");
const customCors = require("./src/middleware/customCors");
const {
    globalErrHandler,
    uncaughtErrHandler,
} = require("./src/middleware/errHandler");
const suppressToastMiddleware = require("./src/middleware/suppressToast");
const ApiResponse = require("./src/model/ApiResponse");
const { appInfo } = require("./src/utils/common");
const port = process.env.PORT || 3001;


//middlewares
app.use(customHelmet);
app.use(customCors);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply suppress toast middleware globally
app.use(suppressToastMiddleware);

//routes
app.use("/auth", require("./src/controller/auth"));
app.use("/appUser", require("./src/controller/appUser"));
app.use("/admin", require("./src/controller/admin"));
app.use("/profile", require("./src/controller/profile"));
app.use("/user-settings", require("./src/controller/userSettings"));
app.use("/settings", require("./src/controller/settings"));
app.use("/payment", require("./src/controller/payment"));
app.use("/loads", require("./src/controller/load"));
app.use("/verify", require("./src/controller/verify"));

app.get("/info", (req, res) => {
    res.status(200).json(new ApiResponse('Request successful!', appInfo));
});

const server = app.listen(port, (err) => {
    if (err) return console.error(err);
    console.log(`Server started at ${port} - ${new Date()}`);
});

// Graceful shutdown logic
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            const { pool } = require("./src/db");
            await pool.end();
            console.log('Database pool closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error during pool shutdown:', err);
            process.exit(1);
        }
    });

    // Force shutdown after 10s if graceful fails
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart signal

uncaughtErrHandler();
app.use(globalErrHandler);
