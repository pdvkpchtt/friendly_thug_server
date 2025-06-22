const express = require("express");

const authRouter = require("./routes/authRouter");
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/userRoutes");
const viewPortRoutes = require("./routes/viewPortRoutes");
const pageRoutes = require("./routes/pageRoutes");
const webElementRoutes = require("./routes/webElementRoutes");
const testRoutes = require("./routes/testRoutes");
const reportRoutes = require("./routes/reportRoutes");
const reportStepRoutes = require("./routes/reportStepRoutes");
const webElementActionRoutes = require("./routes/webElementActionsRoutes");
const generateTestRoutes = require("./routes/generateTestRoutes");
const licenseRoute = require("./routes/licenseRoutes");
const botRoutes = require("./routes/botRoutes");
const testExportImportRoutes = require("./routes/testExportImportRoutes");
const parserRoutes = require("./routes/parserRoutes");

const router = express.Router();

router.use("/auth", authRouter);
router.use("/projects", projectRoutes);
router.use("/users", userRoutes);
router.use("/viewports", viewPortRoutes);
router.use("/reports", reportRoutes);
router.use("/reportsteps", reportStepRoutes);
router.use("/pages", pageRoutes);
router.use("/webelements", webElementRoutes);
router.use("/tests", testRoutes);
router.use("/webelementactions", webElementActionRoutes);
router.use("/generate-tests", generateTestRoutes);
router.use("/license", licenseRoute);
router.use("/bot", botRoutes);
router.use("/test-export-import", testExportImportRoutes);
router.use("/parser", parserRoutes);

module.exports = router;
