const express = require("express");
const router = express.Router();
const { generateTestCases } = require("../../services/generateTestService");
const { createTest } = require("../../services/testService");

/**
 * Генерация и сохранение тестов
 * @route POST /api/generate-tests
 * @param {string} pageId - ID страницы
 * @returns {Array} - Созданные тесты
 */
router.post("/", async (req, res) => {
  const { pageId } = req.body;

  if (!pageId) {
    return res.status(400).json({ error: "pageId is required" });
  }

  try {
    // Генерируем тест-кейсы
    const testCases = await generateTestCases(pageId);

    const filteredData = testCases.map((item) => {
      // Фильтруем steps, оставляя только те, у которых webElementId не пустой
      const filteredSteps = item.steps.filter(
        (step) => step.webElementId !== ""
      );
      // Возвращаем объект с отфильтрованными steps
      return {
        ...item,
        steps: filteredSteps,
      };
    });

    // Сохраняем тесты используя существующую функцию createTest
    const createdTests = [];
    for (const testCase of filteredData) {
      const test = await createTest(
        testCase.title,
        pageId,
        testCase.steps.map((step) => ({
          value: step.value,
          element: { id: step.webElementId },
          action: { id: step.actionId },
        }))
      );
      createdTests.push(test);
    }

    res.status(201).json({ success: "Усепх" });
  } catch (error) {
    console.error("Error in test generation:", error);
    res.status(500).json({
      error: "Failed to generate tests",
      details: error.message,
    });
  }
});

module.exports = router;
