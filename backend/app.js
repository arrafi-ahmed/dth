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

app.listen(port, (err) => {
    if (err) return console.error(err);
    console.log(`Server started at ${port} - ${new Date()}`);

});

uncaughtErrHandler();
app.use(globalErrHandler);
