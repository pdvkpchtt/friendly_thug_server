const puppeteer = require('puppeteer');

const DEVICE_SIZES = {
  TABLET: { width: 1920, height: 1080 },
  DESKTOP: { width: 2560, height: 1440 },
  MOBILE: { width: 320, height: 480 },
};

const cleanHtml = (htmlString) => {
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
    "id", "class", "name", "value", "placeholder", "title", "alt", "href", "src",
    "data-testid", "data-test", "data-qa", "data-cy", "data-id",
    "role", "aria-label", "aria-describedby", "aria-labelledby",
    "type", "for", "label", "colspan", "rowspan"
  ];

  htmlString = htmlString.replace(/<([a-z][a-z0-9]*)([^>]*)>/gi, (match, tag, attrs) => {
    const cleanedAttrs = attrs.replace(
      /([a-z-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^'"\s>]+))?/gi,
      (attrMatch, attrName) => {
        const lowerAttr = attrName.toLowerCase();
        return allowedAttributes.includes(lowerAttr) ? attrMatch : "";
      }
    ).trim();
    return `<${tag}${cleanedAttrs ? " " + cleanedAttrs : ""}>`;
  });

  return htmlString;
};

const fetchHtml = async (url, deviceType = 'DESKTOP') => {
  if (!DEVICE_SIZES[deviceType]) {
    throw new Error(`Unsupported device type: ${deviceType}`);
  }

  const { width, height } = DEVICE_SIZES[deviceType];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width, height });
  await page.goto(url, { waitUntil: 'networkidle2' });
  const html = await page.content();
  await browser.close();

  const cleanedHtml = cleanHtml(html);

  return cleanedHtml;
};

module.exports = { fetchHtml, cleanHtml }; 