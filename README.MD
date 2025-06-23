## **Документация проекта**

### **Структура проекта**
```
project-root/
│
├── prisma/
│   ├── schema.prisma          # Prisma schema file
│   └── migrations/            # Prisma migrations
│
├── src/
│   ├── db/                    # Модуль для работы с базой данных
│   │   └── db.js              # Инициализация Prisma Client
│   │   └──  token/
│   │   │   ├── generateVerificationToken.js # Генерация токена
│   │   │   ├── token.js                     # Функции работы с токеном (CRUD)
│   │   └──  user/
│   │   │   ├── getUser.js                   # Функции работы с пользователем
│   │
│   ├── services/              # Сервисы для бизнес-логики
│   │   ├── projectService.js  # Сервис для работы с проектами
│   │   ├── pageService.js     # Сервис для работы со страницами
│   │   ├── testService.js     # Сервис для работы с тестами
│   │   ├── stepService.js     # Сервис для работы с шагами
│   │   ├── reportService.js   # Сервис для работы с отчетами
│   │   ├── reportSteoRoutes.js  # Сервис для работы с отчетами по шагам
│   │   ├── screenShotsRoutes.js  # Сервис для работы со скринами
│   │   ├── userService.js     # Сервис для работы с пользователями
│   │   ├── actionService.js   # Сервис для работы с действиями (Action)
│   │   ├── webElementService.js # Сервис для работы с веб-элементами
│   │   ├── viewPortService.js # Сервис для работы с вьюпортами
│   │   └── playwrightService.js # Сервис с методами для работы с Playwright
│   │   └──  mail/
│   │   │   ├── sendVerificationMail.js      # Отправка письма с кодом верификации
│   │
│   ├── utils/                 # Утилиты и вспомогательные функции
│   │   ├── generateTest.js    # Скрипт для генерации тестов
│   │   └── playwrightService.js # Сервис с методами для работы с Playwright
│   │   └── webElementParser.js # Скрипт для парсинга веб элементов страницы
│   │   └── vaildation.js      # Валидация форм
│   │
│   ├── api/                   # API-роуты
│   │   ├── routes/
│   │   │   ├── projectRoutes.js # Роуты для проектов
│   │   │   ├── pageRoutes.js    # Роуты для страниц
│   │   │   ├── testRoutes.js    # Роуты для тестов
│   │   │   ├── stepRoutes.js    # Роуты для шагов
│   │   │   ├── reportRoutes.js  # Роуты для отчетов
│   │   │   ├── reportSteoRoutes.js  # Роуты для отчетов по шагам
│   │   │   ├── screenShotsRoutes.js  # Роуты для скринов
│   │   │   ├── actionRoutes.js  # Роуты для действий (Action)
│   │   │   ├── userRoutes.js    # Роуты для пользователей
│   │   │   ├── webElementRoutes.js # Роуты для веб-элементов
│   │   │   └── viewPortRoutes.js # Роуты для вьюпортов
│   │   └── index.js           # Основной файл для инициализации API
│   │
│   ├── scripts/               # Скрипты для выполнения задач
│   │   ├── runTests.js        # Скрипт для запуска тестов
│   │   └── generateTest.js    # Скрипт для генерации тестов
│   │
│   ├── app.js                 # Основной файл приложения
│   └── server.js              # Запуск сервера
│
├── tests/                     # Тесты
│   ├── generated/             # Сгенерированные тесты
│   └── reports/               # Отчеты по тестам
│
├── .env                       # Файл с переменными окружения
├── .gitignore                 # Игнорируемые файлы для Git
├── package.json               # Зависимости и скрипты
└── README.md                  # Документация проекта
└── config.js                  # Конфигурация приложения
```

### **Модели проекта**
shema.prisma
```
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// сессия
model session {
  sid    String   @id @db.VarChar
  sess   Json     @db.Json
  expire DateTime @db.Timestamp(6)

  @@index([expire], map: "IDX_session_expire")
}

// Пользователь
model User {
  id             String         @id @default(cuid())
  email          String         @unique
  username       String?        
  emailVerified  DateTime?      @map("email_verified")
  password       String?
  UserProject    UserProject[]
  createdAt      DateTime       @default(now())

  @@map("users")
}

// Проект (как в Figma, пользователь создает проект и приглашает других юзеров в него)
model Project {
  id          String        @id @default(cuid())
  title       String
  description String?
  UserProject UserProject[]
  Page        Page[]
  createdAt   DateTime      @default(now())

  @@map("projects")
}


// М:М таблица для связи юзеров и проектов, т.к. много пользователей могут состоять в разных проектах
model UserProject {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, projectId])
  @@map("user_projects")
}

// // Словарь распространенных разрешений экранов, который можно дополнять кастомными значениями
// model ViewPort {
//   id        String        @id @default(cuid())
//   title     String
//   type      ViewPortType  @default(DEFAULT)
//   width     Int
//   height    Int
//   projectId String
//   project   Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
//   createdAt DateTime      @default(now())

//   @@map("view_ports")
// }

// Страницы в проекте (в проекте много страниц, для которых создаются тесты)
model Page {
  id          String      @id @default(cuid())
  title       String
  url         String
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  viewportId  String
  viewport    ViewPort     @relation(fields: [viewportId], references: [id], onDelete: Cascade)
  Test        Test[]
  WebElement  WebElement[]
  Folder      Folder[]
  createdAt   DateTime    @default(now())

  @@map("pages")
}

// Список разрешений экрана
model ViewPort {
  id          String      @id @default(cuid())
  title       String
  width       Int
  height      Int
  createdAt   DateTime    @default(now())
  page        Page[]

  @@map("ViewPort")
}

// Список веб-элементов (справочник)
model WebElement {
  id        String   @id @default(cuid())
  title     String
  selector  String
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  Step      Step[]
  createdAt DateTime @default(now())

  @@map("web_elements")
}

// папки для тестов
model Folder {
  id        String   @id @default(cuid())
  title     String
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  parentId  String?
  Tests     Test[]
  parent    Folder?  @relation("FolderToFolder", fields: [parentId], references: [id])
  children  Folder[] @relation("FolderToFolder")
 
  @@map("folder")
}

// Тесты для страниц
model Test {
  id        String   @id @default(cuid())
  title     String
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  Step      Step[]
  Report    Report[]
  createdAt DateTime @default(now())
  folderId  String
  folder    Folder @relation(fields: [folderId], references: [id])

  @@map("tests")
}

// Шаги, создающиеся юзером при формировании теста
model Step {
  id            String     @id @default(cuid())
  value         String
  testId        String
  test          Test       @relation(fields: [testId], references: [id], onDelete: Cascade)
  webElementId  String
  webElement    WebElement @relation(fields: [webElementId], references: [id], onDelete: Cascade)
  actionId      String
  action        Action     @relation(fields: [actionId], references: [id], onDelete: Cascade)
  createdAt     DateTime   @default(now())

  @@map("steps")
}

// Действия, тестируемые на этих шагах (типа клик, ховер и т.д.)
model Action {
  id          String   @id @default(cuid())
  key         String
  description String?
  Step        Step[]
  createdAt   DateTime @default(now())

  @@map("actions")
}

// Отчеты, формирующиеся после прогона тестов
model Report {
  id          String       @id @default(cuid())
  testId      String
  test        Test         @relation(fields: [testId], references: [id], onDelete: Cascade)
  status      Boolean      @default(false)
  executionTime Int?
  ReportStep  ReportStep[]
  createdAt   DateTime     @default(now())

  @@map("reports")
}

// М:М модель для логирования выполнения шагов при прогоне теста
model ReportStep {
  id          String      @id @default(cuid())
  value       String
  reportId    String
  report      Report      @relation(fields: [reportId], references: [id], onDelete: Cascade)
  status      Boolean     @default(false)
  Screenshot  Screenshot?
  createdAt   DateTime    @default(now())

  @@map("report_steps")
}

// Модель для хранения скринов, делающихся во время тестов
model Screenshot {
  id            String      @id @default(cuid())
  data          String
  reportStepId  String      @unique
  reportStep    ReportStep  @relation(fields: [reportStepId], references: [id], onDelete: Cascade)
  createdAt     DateTime    @default(now())

  @@map("screenshots")
}

// Токен для подтверждения почты и верификации почты
model VerificationToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
  @@map("verification_tokens")
}

// Токен для приглашения юзера в проект
model InviteToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
  @@map("invite_tokens")
}

// Токен для приглашения юзера в проект
model PasswordRestorationToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
  @@map("password_restoration_tokens")
}

// Типы вьюпортов (по умолчанию или кастомные)
enum ViewPortType {
  DEFAULT
  CUSTOM
}

## Переменные окружения

- `DISABLE_AUTH=true` — отключает авторизацию. В этом режиме при запуске приложения создаётся только один workspace с названием "Main Workspace" (если его нет). Если он есть, другие воркспейсы не создаются. Все запросы проходят как будто пользователь авторизован.

```
