const { createWebElement, createWebElement_Env } = require("../services/webElementService");
const { parseFromUrl, parseFromHtml } = require('../services/parserService');

// Удаляем все переменные и функции, связанные с AI и callParserAPI

async function parseWebElementsAndDontSave(pageUrl, pageId, viewport, _isAi, file) {
  let elements = [];
  try {
    if (file) {
      if (!file.buffer) throw new Error('File buffer is missing');
      if (file.mimetype !== 'text/html') throw new Error('File is not HTML');
      elements = parseFromHtml(file.buffer.toString('utf-8'));
    } else {
      elements = await parseFromUrl(pageUrl, viewport);
    }
    return elements;
  } catch (error) {
    console.log("Parser failed for URL:", pageUrl, error);
    throw new Error("Failed to parse page: " + error.message);
  }
}

async function parseWebElements(pageUrl, pageId, viewport, _isAi, file) {
  let elements = [];
  try {
    if (file) {
      if (!file.buffer) throw new Error('File buffer is missing');
      if (file.mimetype !== 'text/html') throw new Error('File is not HTML');
      elements = parseFromHtml(file.buffer.toString('utf-8'));
    } else {
      elements = await parseFromUrl(pageUrl, viewport);
    }
  } catch (error) {
    console.log("Parser failed for URL:", pageUrl, error);
    throw new Error("Failed to parse page: " + error.message);
  }

  try {
    await createWebElement_Env(pageId, elements, false);
    console.log(`Saved ${elements.length} elements for page ${pageId}`);
  } catch (dbError) {
    console.log("Failed to save elements to DB:", dbError);
    throw dbError;
  }
}

async function parseWebElementsFromFile(file, pageId) {
  let elements = [];
  try {
    if (!file.buffer) throw new Error('File buffer is missing');
    if (file.mimetype !== 'text/html') throw new Error('File is not HTML');
    elements = parseFromHtml(file.buffer.toString('utf-8'));
  } catch (error) {
    console.log("Parser failed for file:", error);
    throw new Error("Failed to parse file: " + error.message);
  }

  try {
    await createWebElement_Env(pageId, elements, false);
    console.log(`Saved ${elements.length} elements from file for page ${pageId}`);
  } catch (dbError) {
    console.log("Failed to save elements to DB:", dbError);
    throw dbError;
  }
}

module.exports = {
  parseWebElements,
  parseWebElementsFromFile,
  parseWebElementsAndDontSave,
};
