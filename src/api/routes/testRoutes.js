const express = require("express");
const router = express.Router();
const {
  createTest,
  getTestById,
  getTestsByPageId,
  updateTest,
  deleteTest,
  cleanupGeneratedTests,
  runTestsInSeparateProcess,
} = require("../../services/testService");
const {
  setTrueTestsStatus,
  setFalseTestsStatus,
  isTrueTestsStatus,
} = require("../../services/testRunningStatusService");

/**
 * Создание нового теста.
 * @route POST /api/tests
 * @param {string} title - Название теста.
 * @param {string} pageId - ID страницы, к которой привязан тест.
 * @returns {Object} - Созданный тест.
 */
router.post("/", async (req, res) => {
  const { title, pageId, steps } = req.body;

  // console.log(title, pageId, steps);

  if (
    !title ||
    !pageId ||
    !!steps?.find((i) => !i?.action?.id || !i?.element?.id)
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const test = await createTest(title, pageId, steps);
    res.status(201).json({ success: "Success", test });
  } catch (error) {
    res.status(500).json({ error: "Failed to create test" });
  }
});

/**
 * Получение информации о тесте по ID.
 * @route GET /api/tests/:testId
 * @param {string} testId - ID теста.
 * @returns {Object} - Найденный тест.
 */
router.get("/:testId", async (req, res) => {
  const { testId } = req.params;

  try {
    const test = await getTestById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }
    res
      .status(200)
      .json({ success: "Success", test: test?.arr, name: test?.name });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch test" });
  }
});

/**
 * Получение всех тестов для страницы.
 * @route GET /api/tests/page/:pageId
 * @param {string} pageId - ID страницы.
 * @returns {Array} - Список тестов.
 */
router.get("/page/:pageId", async (req, res) => {
  const { pageId } = req.params;

  try {
    const tests = await getTestsByPageId(pageId);
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

/**
 * Обновление данных теста.
 * @route PUT /api/tests/:testId
 * @param {string} testId - ID теста.
 * @param {Object} data - Данные для обновления (title).
 * @returns {Object} - Обновленный тест.
 */
router.put("/:testId", async (req, res) => {
  const { title, steps, testId } = req.body;

  // console.log(title, pageId, steps);

  if (
    !testId ||
    !title ||
    !!steps?.find((i) => !i?.action?.id || !i?.element?.id)
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const test = await updateTest(title, steps, testId);
    res
      .status(200)
      .json({ success: "Success", test: test?.arr, name: test?.name });
  } catch (error) {
    res.status(500).json({ error: "Failed to update test" });
  }
});

/**
 * Удаление теста по ID.
 * @route DELETE /api/tests/:testId
 * @param {string} testId - ID теста.
 * @returns {Object} - Удаленный тест.
 */
router.delete("/:testId", async (req, res) => {
  const { testId } = req.params;

  try {
    const test = await deleteTest(testId);
    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete test" });
  }
});

/**
 * Роут для запуска тестов по массиву ID
 */
router.post("/run-tests", async (req, res) => {
  const { testIds, browser } = req.body;

  console.log(browser);

  // Валидация testIds
  if (!testIds || !Array.isArray(testIds)) {
    return res.status(400).json({ error: "testIds must be an array" });
  }

  // Валидация browser
  const allowedBrowsers = ["Safari", "Chrome", "Firefox"];
  if (!browser || !allowedBrowsers.includes(browser)) {
    return res.status(400).json({
      error: `Invalid browser. Allowed values are: ${allowedBrowsers.join(
        ", "
      )}`,
    });
  }

  try {
    const statuses = await isTrueTestsStatus();
    if (!!statuses.find((i) => i.isRunning === true))
      return res.status(500).json({ error: "Some tests is running" });

    await setTrueTestsStatus(testIds);
    // Передаем browser в функцию runTestsInSeparateProcess
    const report = await runTestsInSeparateProcess(testIds, browser);
    return res.status(200).json(report);
  } catch (error) {
    await setFalseTestsStatus(testIds);
    console.error("Error running tests:", error);
    return res.status(500).json({ error: error });
  } finally {
    await setFalseTestsStatus(testIds);
    cleanupGeneratedTests();
    console.log("success");
  }
});

module.exports = router;
