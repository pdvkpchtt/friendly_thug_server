const startApp = require("./src/app");
const { initializeViewPorts } = require("./src/services/viewPortService");
const {
  initializeWebElementActions,
} = require("./src/services/webElementActionsService");
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

(async () => {
  try {
    const app = await startApp(); // Запускаем инициализацию приложения
    await ensureSingleWorkspace();
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
    await initializeApp();
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error.message);
    process.exit(1); // Остановка приложения при ошибке
  }
})();
