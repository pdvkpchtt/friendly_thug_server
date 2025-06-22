# API для экспорта и импорта тестов

Этот API позволяет экспортировать и импортировать тесты и веб-элементы страницы в формате JSON.

## Основные возможности

- **Экспорт**: Экспорт всех тестов и веб-элементов страницы в JSON файл
- **Импорт**: Импорт тестов и веб-элементов из JSON файла в целевую страницу
- **Предварительный просмотр**: Анализ данных перед импортом
- **Валидация**: Проверка данных на конфликты и ошибки
- **Статистика**: Получение статистики страницы для экспорта

## Структура экспортируемых данных

```json
{
  "page": {
    "id": "page_id",
    "title": "Page Title",
    "url": "https://example.com",
    "viewport": {
      "id": "viewport_id",
      "title": "Desktop",
      "width": 1920,
      "height": 1080
    }
  },
  "webElements": [
    {
      "id": "element_id",
      "title": "Login Button",
      "selector": "#login-btn",
      "fromEnv": false
    }
  ],
  "tests": [
    {
      "id": "test_id",
      "title": "Login Test",
      "steps": [
        {
          "id": "step_id",
          "value": "test@example.com",
          "webElement": {
            "id": "element_id",
            "title": "Email Input",
            "selector": "#email"
          },
          "action": {
            "id": "action_id",
            "name": "fill",
            "withValue": true
          }
        }
      ]
    }
  ],
  "exportDate": "2024-01-01T00:00:00.000Z",
  "version": "1.0"
}
```

## API Endpoints

### 1. Экспорт тестов страницы

**GET** `/api/test-export-import/export/:pageId`

Экспортирует все тесты и веб-элементы страницы в JSON формате.

**Параметры:**
- `pageId` (string, required) - ID страницы для экспорта

**Ответ:**
```json
{
  "page": { ... },
  "webElements": [ ... ],
  "tests": [ ... ],
  "exportDate": "2024-01-01T00:00:00.000Z",
  "version": "1.0"
}
```

**Пример использования:**
```bash
curl -X GET "http://localhost:3000/api/test-export-import/export/page_123" \
  -H "Content-Type: application/json"
```

### 2. Импорт тестов страницы

**POST** `/api/test-export-import/import/:pageId`

Импортирует тесты и веб-элементы из JSON файла в целевую страницу.

**Параметры:**
- `pageId` (string, required) - ID целевой страницы для импорта

**Тело запроса:**
```json
{
  "page": { ... },
  "webElements": [ ... ],
  "tests": [ ... ]
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Import completed successfully",
  "importedData": {
    "webElements": [
      {
        "oldId": "old_element_id",
        "newId": "new_element_id",
        "title": "Login Button",
        "status": "created"
      }
    ],
    "tests": [
      {
        "oldId": "old_test_id",
        "newId": "new_test_id",
        "title": "Login Test",
        "steps": [ ... ],
        "status": "created"
      }
    ],
    "errors": []
  },
  "summary": {
    "totalWebElements": 5,
    "totalTests": 3,
    "importedWebElements": 5,
    "importedTests": 3,
    "errors": 0
  }
}
```

**Пример использования:**
```bash
curl -X POST "http://localhost:3000/api/test-export-import/import/target_page_456" \
  -H "Content-Type: application/json" \
  -d @exported_tests.json
```

### 3. Статистика страницы

**GET** `/api/test-export-import/stats/:pageId`

Получает статистику страницы для экспорта/импорта.

**Параметры:**
- `pageId` (string, required) - ID страницы

**Ответ:**
```json
{
  "success": true,
  "stats": {
    "pageId": "page_123",
    "pageTitle": "Login Page",
    "webElementsCount": 10,
    "testsCount": 5,
    "totalStepsCount": 25,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Предварительный просмотр

**POST** `/api/test-export-import/preview/:pageId`

Анализирует данные для импорта без выполнения импорта.

**Параметры:**
- `pageId` (string, required) - ID целевой страницы

**Тело запроса:**
```json
{
  "page": { ... },
  "webElements": [ ... ],
  "tests": [ ... ]
}
```

**Ответ:**
```json
{
  "success": true,
  "preview": {
    "sourcePage": {
      "title": "Source Page",
      "url": "https://source.com",
      "viewport": { ... }
    },
    "webElements": {
      "total": 5,
      "list": [
        {
          "title": "Login Button",
          "selector": "#login-btn"
        }
      ]
    },
    "tests": {
      "total": 3,
      "list": [
        {
          "title": "Login Test",
          "stepsCount": 5
        }
      ]
    },
    "totalSteps": 15,
    "exportDate": "2024-01-01T00:00:00.000Z",
    "version": "1.0"
  }
}
```

### 5. Валидация данных

**POST** `/api/test-export-import/validate/:pageId`

Проверяет данные на конфликты и ошибки перед импортом.

**Параметры:**
- `pageId` (string, required) - ID целевой страницы

**Тело запроса:**
```json
{
  "page": { ... },
  "webElements": [ ... ],
  "tests": [ ... ]
}
```

**Ответ:**
```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": [
      "2 web elements will be reused (existing elements with same selectors)",
      "1 tests will be updated (existing tests with same titles)"
    ],
    "conflicts": {
      "webElements": [
        {
          "imported": "Login Button",
          "existing": "Existing Login Button",
          "selector": "#login-btn"
        }
      ],
      "tests": [
        {
          "imported": "Login Test",
          "existing": "Existing Login Test"
        }
      ]
    }
  }
}
```

## Логика работы

### Экспорт
1. Получает страницу со всеми связанными данными
2. Формирует структурированный JSON объект
3. Возвращает данные с метаданными (дата экспорта, версия)

### Импорт
1. Валидирует структуру данных
2. Проверяет существование целевой страницы
3. Создает маппинг старых ID на новые
4. Импортирует веб-элементы (с проверкой дубликатов по селектору)
5. Импортирует тесты (с обновлением существующих по названию)
6. Создает шаги тестов с правильными связями
7. Возвращает детальный отчет об импорте

### Обработка конфликтов
- **Веб-элементы**: Если элемент с таким селектором уже существует, используется существующий
- **Тесты**: Если тест с таким названием уже существует, он обновляется (шаги пересоздаются)
- **Действия**: Если действие не существует, создается новое

## Обработка ошибок

Все endpoints возвращают стандартные HTTP коды:
- `200` - Успешное выполнение
- `400` - Ошибка валидации (неверные параметры)
- `500` - Внутренняя ошибка сервера

В случае ошибки возвращается JSON с описанием:
```json
{
  "error": "Error description",
  "details": "Detailed error message"
}
```

## Примеры использования

### Экспорт тестов
```javascript
// Получение экспорта
const response = await fetch('/api/test-export-import/export/page_123');
const exportData = await response.json();

// Сохранение в файл
const blob = new Blob([JSON.stringify(exportData, null, 2)], {
  type: 'application/json'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `page-tests-${pageId}.json`;
a.click();
```

### Импорт тестов
```javascript
// Загрузка файла
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];
const importData = JSON.parse(await file.text());

// Предварительная валидация
const validationResponse = await fetch('/api/test-export-import/validate/target_page_456', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(importData)
});
const validation = await validationResponse.json();

if (validation.validation.isValid) {
  // Выполнение импорта
  const importResponse = await fetch('/api/test-export-import/import/target_page_456', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(importData)
  });
  const result = await importResponse.json();
  console.log('Import completed:', result);
}
``` 