# QAI.Agent API - Руководство для клиентов

## Обзор

QAI.Agent предоставляет REST API для интеграции с вашими системами тестирования. API позволяет запускать тесты, получать отчеты и аналитику программно.

## Аутентификация

В текущей версии API не требует аутентификации, но рекомендуется использовать HTTPS для защиты данных.

## Базовый URL

```
https://your-server-domain.com/api/bot
```

## Проверка статуса системы

### Получение информации о тарифе и доступных функциях

```bash
GET /api/bot/status
```

**Ответ:**
```json
{
  "status": "success",
  "data": {
    "subscription_plan": "pro",
    "features": {
      "telegram_bot": true,
      "manual_run": true,
      "scheduled_run": true,
      "email_notifications": true,
      "analytics_week": true,
      "analytics_6months": true,
      "ci_cd": true
    },
    "server_time": "2025-06-29T07:30:00.000Z",
    "version": "1.0.0"
  }
}
```

## Запуск тестов

### Запуск всех тестов (только STANDARD и PRO тарифы)

```bash
GET /api/bot/run_test/all
```

**Описание:** Запускает все доступные тесты в системе.

**Ответ при успешном запуске:**
```json
{
  "status": "progress",
  "data": "Запущено 5 тестов, ожидайте отчеты..."
}
```

**Ответ при ошибке:**
```json
{
  "status": "error",
  "data": "Some tests is running"
}
```

**Возможные статусы:**
- `progress` - тесты запущены, ожидайте отчеты
- `success` - тесты выполнены, отчеты готовы
- `error` - произошла ошибка

## Получение отчетов

### Получение отчетов по выполненным тестам

```bash
GET /api/bot/get_reports
```

**Описание:** Возвращает отчеты по всем выполненным тестам.

**Ответ при успехе:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "test_id_1",
      "title": "Тест авторизации",
      "status": true,
      "Report": [
        {
          "status": true,
          "ReportStep": [
            {
              "value": "Открыта страница логина",
              "status": true,
              "Screenshot": {
                "data": "base64_encoded_image"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**Ответ при ошибке:**
```json
{
  "status": "error",
  "data": "Отчеты еще не готовы"
}
```

## Аналитика

### Получение аналитики за период (только STANDARD и PRO тарифы)

```bash
GET /api/bot/get_analytics/{period}
```

**Параметры:**
- `period` - период аналитики:
  - `day` - за день (STANDARD, PRO)
  - `week` - за неделю (STANDARD, PRO)
  - `month` - за месяц (только PRO)
  - `6months` - за полгода (только PRO)

**Примеры запросов:**
```bash
GET /api/bot/get_analytics/day
GET /api/bot/get_analytics/week
GET /api/bot/get_analytics/month
GET /api/bot/get_analytics/6months
```

**Ответ:**
```json
{
  "status": "success",
  "data": {
    "totalTests": 25,
    "passedTests": 22,
    "failedTests": 3,
    "successRate": 88.0,
    "averageExecutionTime": 4500
  }
}
```

## API спецификация (только PRO тариф)

### Получение полной спецификации API

```bash
GET /api/bot/api-spec
```

**Ответ:**
```json
{
  "name": "QAI.Agent API",
  "version": "1.0.0",
  "description": "API для интеграции с CI/CD системами",
  "subscription_plan": "pro",
  "endpoints": {
    "POST /api/bot/run_test/all": {
      "description": "Запуск всех тестов",
      "method": "POST",
      "url": "/api/bot/run_test/all",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "browser": "Chrome|Firefox|Safari (optional, default: Chrome)"
      },
      "response": {
        "success": {
          "status": "success|progress|error",
          "data": "reports array or status message"
        }
      }
    }
  },
  "authentication": {
    "type": "API Key",
    "header": "X-API-Key",
    "description": "API ключ для аутентификации (если настроен)"
  },
  "rate_limits": {
    "requests_per_minute": 60,
    "requests_per_hour": 1000
  }
}
```

## Примеры использования

### Python

```python
import requests
import time

# Базовый URL
base_url = "https://your-server-domain.com/api/bot"

# Проверка статуса
response = requests.get(f"{base_url}/status")
print(f"Тариф: {response.json()['data']['subscription_plan']}")

# Запуск тестов
response = requests.get(f"{base_url}/run_test/all")
if response.json()['status'] == 'progress':
    print("Тесты запущены, ожидаем отчеты...")
    
    # Ждем отчеты
    for i in range(30):  # максимум 30 попыток
        time.sleep(10)  # ждем 10 секунд
        response = requests.get(f"{base_url}/get_reports")
        if response.json()['status'] == 'success':
            reports = response.json()['data']
            print(f"Получено {len(reports)} отчетов")
            break
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const baseUrl = 'https://your-server-domain.com/api/bot';

// Проверка статуса
async function checkStatus() {
    try {
        const response = await axios.get(`${baseUrl}/status`);
        console.log(`Тариф: ${response.data.data.subscription_plan}`);
    } catch (error) {
        console.error('Ошибка при проверке статуса:', error.message);
    }
}

// Запуск тестов и получение отчетов
async function runTestsAndGetReports() {
    try {
        // Запускаем тесты
        const runResponse = await axios.get(`${baseUrl}/run_test/all`);
        
        if (runResponse.data.status === 'progress') {
            console.log('Тесты запущены, ожидаем отчеты...');
            
            // Ждем отчеты
            for (let i = 0; i < 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                
                const reportsResponse = await axios.get(`${baseUrl}/get_reports`);
                if (reportsResponse.data.status === 'success') {
                    const reports = reportsResponse.data.data;
                    console.log(`Получено ${reports.length} отчетов`);
                    return reports;
                }
            }
        }
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}
```

### cURL

```bash
# Проверка статуса
curl -X GET "https://your-server-domain.com/api/bot/status"

# Запуск тестов
curl -X GET "https://your-server-domain.com/api/bot/run_test/all"

# Получение отчетов
curl -X GET "https://your-server-domain.com/api/bot/get_reports"

# Получение аналитики за неделю
curl -X GET "https://your-server-domain.com/api/bot/get_analytics/week"
```

## Интеграция с CI/CD

### GitHub Actions

```yaml
name: QAI Tests
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Run QAI Tests
      run: |
        # Запускаем тесты
        curl -X GET "https://your-server-domain.com/api/bot/run_test/all"
        
        # Ждем и получаем отчеты
        for i in {1..30}; do
          sleep 10
          response=$(curl -s "https://your-server-domain.com/api/bot/get_reports")
          if echo "$response" | grep -q '"status":"success"'; then
            echo "Тесты завершены"
            break
          fi
        done
```

### GitLab CI

```yaml
stages:
  - test

qai_tests:
  stage: test
  script:
    - |
      # Запускаем тесты
      curl -X GET "https://your-server-domain.com/api/bot/run_test/all"
      
      # Ждем отчеты
      for i in {1..30}; do
        sleep 10
        response=$(curl -s "https://your-server-domain.com/api/bot/get_reports")
        if echo "$response" | grep -q '"status":"success"'; then
          echo "Тесты завершены"
          break
        fi
      done
```

## Обработка ошибок

### Коды ошибок

- `403` - Функция недоступна для вашего тарифа
- `400` - Неверный запрос
- `500` - Внутренняя ошибка сервера

### Примеры ошибок

```json
{
  "status": "error",
  "data": "Ручной запуск тестов доступен только в тарифах STANDARD и PRO"
}
```

```json
{
  "status": "error",
  "data": "Аналитика за месяц и 6 месяцев доступна только в тарифе PRO"
}
```

## Ограничения

### Rate Limiting
- 60 запросов в минуту
- 1000 запросов в час

### Таймауты
- Запуск тестов: до 120 секунд
- Получение отчетов: до 15 секунд
- Получение аналитики: до 20 секунд

## Поддержка

При возникновении вопросов или проблем обращайтесь в QAITECH:
- Email: support@qaitech.ru
- Сайт: https://qaitech.ru

## Обновления API

API версионируется через заголовок `Accept-Version`. Текущая версия: `1.0.0`

```bash
curl -H "Accept-Version: 1.0.0" "https://your-server-domain.com/api/bot/status"
``` 