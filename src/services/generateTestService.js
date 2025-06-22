const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config();
const { getAllActions } = require("../services/actionService");
const { getWebElementsByPageId } = require("../services/webElementService");

const GENERATOR_URL = process.env.TEST_GENERATOR_URL || "http://localhost:3002";

/**
 * Генерирует тесты через микросервис
 * @param {string} pageId - ID страницы
 * @returns {Promise<Array>} - Сгенерированные тест-кейсы
 */
const generateTestCases = async (pageId) => {
  try {
    // Получаем данные из БД используя существующие функции
    const elements = await getWebElementsByPageId(pageId);
    const actions = await getAllActions();

    // Подготавливаем данные для запроса
    const requestData = {
      elements: elements.map((el) => ({
        id: el.id,
        title: el.title,
        selector: el.selector,
        type: el.type || "element",
      })),
      actions: actions.map((act) => ({
        id: act.id,
        name: act.name,
        withValue: act.withValue,
      })),
    };

    // Логирование запроса
    console.log("Sending to test generator:", {
      elementsCount: elements.length,
      actionsCount: actions.length,
    });

    const response = await axios.post(
      `${GENERATOR_URL}/api/generate-tests`,
      requestData
      // { timeout: 100000 }
    );

    if (!response.data?.tests?.test_cases) {
      throw new Error("Invalid response format from test generator");
    }

    return response.data.tests.test_cases;
  } catch (error) {
    console.error("Test generation failed:", error.message);
    throw error;
  }
};

const saveGeneratedTests = async (pageId, testCases) => {
  return await prisma.$transaction(async (tx) => {
    const savedTests = [];

    for (const testCase of testCases) {
      const test = await tx.test.create({
        data: {
          title: testCase.title,
          pageId: pageId,
          Step: {
            create: testCase.steps.map((step) => ({
              // Используем create вместо createMany для лучшей обработки ошибок
              value: step.value,
              webElementId: step.webElementId,
              actionId: step.actionId,
            })),
          },
        },
        include: {
          Step: {
            include: {
              webElement: true,
              action: true,
            },
          },
        },
      });
      savedTests.push(test);
    }

    return savedTests;
  });
};

module.exports = {
  generateTestCases,
  saveGeneratedTests,
};
