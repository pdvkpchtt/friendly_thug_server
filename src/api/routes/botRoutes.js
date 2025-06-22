const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const getAllTest = require("../../services/getAllTest");
const getTestsLastReport = require("../../services/getTestsLastReport");
const { getStats } = require("../../services/getStats");
const reportToHtml = require("../../utils/reportToHtml");
const sendReportMail = require("../../services/mail/sendReportMail");

router.get("/run_all/:company_id", async (req, res) => {
  try {
    const allTests = await getAllTest(req.params.company_id);

    console.log(allTests);

    await axios
      .post(`${process.env.THIS_ORIGIN}/api/tests/run-tests`, {
        testIds: allTests,
        browser: "Chrome",
      })
      .then(async (response) => {
        console.log("woow");
      });
    // .catch((error) => {
    //   return res
    //     .status(500)
    //     .json({ data: "Что-то пошло не так", status: "error" });
    // });

    const reports = await getTestsLastReport(allTests);

    console.log(
      process.env.SEND_EMAIL_REPORTS == "true",
      JSON.parse(process.env.EMAIL_FOR_REPORTS)
    );

    if (
      process.env.SEND_EMAIL_REPORTS == "true" &&
      !!process.env.EMAIL_FOR_REPORTS &&
      JSON.parse(process.env.EMAIL_FOR_REPORTS).length > 0
    ) {
      for (let rep of reports) {
        const htmlReportForMail = reportToHtml(rep);
        for (let mail of JSON.parse(process.env.EMAIL_FOR_REPORTS))
          await sendReportMail(
            mail,
            htmlReportForMail,
            rep.Report.flatMap((report) =>
              report.ReportStep.map((step) => step.Screenshot?.data)
            )
          );
      }
    }

    return res.status(200).json({ data: reports, status: "success" });
  } catch (err) {
    console.log(err, "Error to bot");

    return res
      .status(500)
      .json({ data: err.response?.data?.error, status: "error" });
  }
});

router.get("/get_analytics/:period", async (req, res) => {
  try {
    const allTests = await getStats(req.params.period);

    console.log(allTests);

    return res.status(200).json({
      data: allTests,
      status: "success",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ data: "Что-то пошло не так", status: "error" });
  }
});

module.exports = router;
