const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const getAllTest = require("../../services/getAllTest");
const getAllTestsWithoutCompany = require("../../services/getAllTestsWithoutCompany");
const getTestsLastReport = require("../../services/getTestsLastReport");
const { getStats } = require("../../services/getStats");
const reportToHtml = require("../../utils/reportToHtml");
const sendReportMail = require("../../services/mail/sendReportMail");

// Функция для логирования
const logBot = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[BOT] ${timestamp} - ${message}`;
  console.log(logMessage);
  if (data) {
    console.log('[BOT] Data:', JSON.stringify(data, null, 2));
  }
};

// Роуты для совместимости с API бота
router.get("/run_test/all", async (req, res) => {
  logBot("Получен запрос на запуск всех тестов");
  
  try {
    // Получаем все тесты из всех проектов
    logBot("Получение всех тестов из всех проектов...");
    const allTests = await getAllTestsWithoutCompany();
    logBot(`Найдено тестов: ${allTests.length}`, allTests);

    if (allTests.length === 0) {
      logBot("Тесты не найдены");
      return res.status(200).json({ 
        status: "error", 
        data: "Тесты не найдены" 
      });
    }

    // Запускаем тесты
    logBot("Запуск тестов через API...");
    try {
      const runResponse = await axios.post(`${process.env.THIS_ORIGIN || 'http://localhost:3000'}/api/tests/run-tests`, {
        testIds: allTests,
        browser: "Chrome",
      });
      logBot("Тесты запущены успешно", runResponse.data);
    } catch (error) {
      logBot("Ошибка при запуске тестов", error.response?.data || error.message);
      return res.status(200).json({ 
        status: "error", 
        data: "Ошибка при запуске тестов" 
      });
    }

    // Ждем завершения тестов и получаем отчеты
    logBot("Ожидание завершения тестов...");
    
    // Функция для ожидания и получения отчетов
    const waitForReports = async () => {
      let attempts = 0;
      const maxAttempts = 30; // 30 попыток по 10 секунд = 5 минут
      
      while (attempts < maxAttempts) {
        try {
          logBot(`Попытка получения отчетов ${attempts + 1}/${maxAttempts}`);
          const reports = await getTestsLastReport(allTests);
          
          if (reports && reports.length > 0) {
            logBot(`Получено отчетов: ${reports.length}`, reports.map(r => ({ id: r.id, status: r.status })));
            
            // Отправляем отчеты по email, если настроено
            if (
              process.env.SEND_EMAIL_REPORTS == "true" &&
              !!process.env.EMAIL_FOR_REPORTS &&
              JSON.parse(process.env.EMAIL_FOR_REPORTS).length > 0
            ) {
              logBot("Отправка отчетов по email...");
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
            
            return reports;
          } else {
            logBot("Отчеты еще не готовы, ожидание...");
            await new Promise(resolve => setTimeout(resolve, 10000)); // Ждем 10 секунд
            attempts++;
          }
        } catch (error) {
          logBot("Ошибка при получении отчетов", error.message);
          await new Promise(resolve => setTimeout(resolve, 10000));
          attempts++;
        }
      }
      
      logBot("Превышено время ожидания отчетов");
      return null;
    };

    // Запускаем ожидание отчетов в фоне
    waitForReports().then(reports => {
      if (reports) {
        logBot("Отчеты успешно получены и обработаны");
      } else {
        logBot("Не удалось получить отчеты в отведенное время");
      }
    });

    return res.status(200).json({ 
      status: "progress", 
      data: `Запущено ${allTests.length} тестов из всех проектов. Ожидайте отчеты...` 
    });
  } catch (err) {
    logBot("Критическая ошибка в роуте run_test/all", err.message);
    return res.status(200).json({ 
      status: "error", 
      data: "Что-то пошло не так" 
    });
  }
});

// Роут для получения аналитики (совместимость с API бота)
router.get("/get_analytics/:period", async (req, res) => {
  const period = req.params.period;
  logBot(`Получен запрос аналитики за период: ${period}`);
  
  try {
    const stats = await getStats(period);
    logBot("Аналитика получена успешно", stats);

    return res.status(200).json({
      data: stats,
      status: "success",
    });
  } catch (err) {
    logBot("Ошибка при получении аналитики", err.message);
    return res.status(200).json({ 
      status: "error", 
      data: "Что-то пошло не так" 
    });
  }
});

// Роут для получения отчетов по тестам (новый)
router.get("/get_reports", async (req, res) => {
  logBot("Получен запрос на получение отчетов");
  
  try {
    const allTests = await getAllTestsWithoutCompany();
    logBot(`Получение отчетов для ${allTests.length} тестов`);
    
    if (allTests.length === 0) {
      logBot("Тесты не найдены");
      return res.status(200).json({ 
        status: "error", 
        data: "Тесты не найдены" 
      });
    }

    const reports = await getTestsLastReport(allTests);
    logBot(`Получено отчетов: ${reports.length}`, reports.map(r => ({ id: r.id, status: r.status })));

    return res.status(200).json({ 
      data: reports, 
      status: "success" 
    });
  } catch (err) {
    logBot("Ошибка при получении отчетов", err.message);
    return res.status(200).json({ 
      status: "error", 
      data: "Ошибка при получении отчетов" 
    });
  }
});

// Существующие роуты для обратной совместимости
router.get("/run_all/:company_id", async (req, res) => {
  const companyId = req.params.company_id;
  logBot(`Получен запрос на запуск тестов для компании: ${companyId}`);
  
  try {
    const allTests = await getAllTest(companyId);
    logBot(`Найдено тестов для компании ${companyId}: ${allTests.length}`);

    await axios
      .post(`${process.env.THIS_ORIGIN}/api/tests/run-tests`, {
        testIds: allTests,
        browser: "Chrome",
      })
      .then(async (response) => {
        logBot("Тесты запущены успешно");
      });

    const reports = await getTestsLastReport(allTests);
    logBot(`Получено отчетов: ${reports.length}`);

    if (
      process.env.SEND_EMAIL_REPORTS == "true" &&
      !!process.env.EMAIL_FOR_REPORTS &&
      JSON.parse(process.env.EMAIL_FOR_REPORTS).length > 0
    ) {
      logBot("Отправка отчетов по email...");
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
    logBot("Ошибка в роуте run_all", err.message);
    return res
      .status(500)
      .json({ data: err.response?.data?.error, status: "error" });
  }
});

module.exports = router;
