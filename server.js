const startApp = require("./src/app");
const { initializeViewPorts } = require("./src/services/viewPortService");
const {
  initializeWebElementActions,
} = require("./src/services/webElementActionsService");
const telegramBotService = require("./src/services/telegramBotService");
const PORT = process.env.PORT || 3000;
const prisma = require("./src/db/db");
require("dotenv").config();

// Инициализация данных при старте приложения
async function initializeApp() {
  try {
    console.log("Инициализация предопределенных веб-элементов...");
    await initializeWebElementActions(); // Вызов метода инициализации
    await initializeViewPorts();
    console.log("Веб-элементы успешно инициализированы.");
  } catch (error) {
    console.error("Ошибка при инициализации данных:", error.message);
    process.exit(1); // Остановка приложения при ошибке
  }
}

// Инициализация телеграм бота
async function initializeTelegramBot() {
  try {
    console.log("Инициализация Telegram бота...");
    await telegramBotService.initialize();
    console.log("Telegram бот успешно инициализирован.");
  } catch (error) {
    console.error("Ошибка при инициализации Telegram бота:", error.message);
    // Не останавливаем приложение, если бот не удалось инициализировать
  }
}

async function ensureSingleWorkspace() {
  if (process.env.DISABLE_AUTH === "true") {
    // Проверяем, есть ли уже workspace с названием "Main Workspace"
    let mainWorkspace = await prisma.project.findFirst({
      where: { title: "Main Workspace" },
    });
    if (!mainWorkspace) {
      // Создаем workspace и пользователя-заглушку
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: "admin@local",
            username: "admin",
            emailVerified: new Date(),
            password: "", // без пароля
          },
        });
      }
      mainWorkspace = await prisma.project.create({
        data: {
          title: "Main Workspace",
          description: "",
          UserProject: {
            create: {
              userId: user.id,
            },
          },
        },
      });
    }
  }
}

// Обработка завершения приложения
process.on('SIGINT', async () => {
  console.log('Получен сигнал SIGINT, завершение работы...');
  if (telegramBotService.isBotRunning()) {
    await telegramBotService.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Получен сигнал SIGTERM, завершение работы...');
  if (telegramBotService.isBotRunning()) {
    await telegramBotService.stop();
  }
  process.exit(0);
});

(async () => {
  try {
    const app = await startApp(); // Запускаем инициализацию приложения
    await ensureSingleWorkspace();
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
    await initializeApp();
    await initializeTelegramBot(); // Инициализируем телеграм бота после запуска сервера
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error.message);
    process.exit(1); // Остановка приложения при ошибке
  }
})();
