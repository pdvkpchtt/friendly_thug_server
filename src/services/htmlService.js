const puppeteer = require("puppeteer");

const DEVICE_SIZES = {
  TABLET: { width: 1920, height: 1080 },
  DESKTOP: { width: 2560, height: 1440 },
  MOBILE: { width: 320, height: 480 },
};

const cleanHtml = (htmlString) => {
  if (!htmlString) return "";

  htmlString = htmlString.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "");
  htmlString = htmlString.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  htmlString = htmlString.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  const bodyMatch = htmlString.match(/<body\b[^>]*>[\s\S]*?<\/body>/i);
  if (bodyMatch) {
    htmlString = bodyMatch[0];
  } else {
    return "";
  }

  const allowedAttributes = [
    "id",
    "class",
    "name",
    "value",
    "placeholder",
    "title",
    "alt",
    "href",
    "src",
    "data-testid",
    "data-test",
    "data-qa",
    "data-cy",
    "data-id",
    "role",
    "aria-label",
    "aria-describedby",
    "aria-labelledby",
    "type",
    "for",
    "label",
    "colspan",
    "rowspan",
  ];

  htmlString = htmlString.replace(
    /<([a-z][a-z0-9]*)([^>]*)>/gi,
    (match, tag, attrs) => {
      const cleanedAttrs = attrs
        .replace(
          /([a-z-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^'"\s>]+))?/gi,
          (attrMatch, attrName) => {
            const lowerAttr = attrName.toLowerCase();
            return allowedAttributes.includes(lowerAttr) ? attrMatch : "";
          }
        )
        .trim();
      return `<${tag}${cleanedAttrs ? " " + cleanedAttrs : ""}>`;
    }
  );

  return htmlString;
};

const fetchHtml = async (url, deviceType = "DESKTOP") => {
  if (!DEVICE_SIZES[deviceType]) {
    throw new Error(`Unsupported device type: ${deviceType}`);
  }

  const { width, height } = DEVICE_SIZES[deviceType];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new", // Используем новый headless-режим
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    // Устанавливаем таймаут и обработку ошибок загрузки
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const html = await page.content();
    return cleanHtml(html);
  } catch (error) {
    console.error("Error fetching HTML:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { fetchHtml, cleanHtml };
