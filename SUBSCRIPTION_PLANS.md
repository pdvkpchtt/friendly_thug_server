# QAI.Agent - Тарифные планы

## Обзор тарифов

### START
- ✅ Запуск по расписанию
- ✅ Email для оповещения
- ❌ Telegram бот
- ❌ Ручной запуск тестов
- ❌ Аналитика

### STANDARD
- ✅ Запуск по расписанию
- ✅ Email для оповещения
- ✅ Telegram бот
- ✅ Возможность ручного запуска
- ✅ Аналитика за неделю
- ❌ Аналитика за 6 месяцев
- ❌ CI/CD интеграция

### PRO
- ✅ Запуск по расписанию
- ✅ Email для оповещения
- ✅ Telegram бот
- ✅ Возможность ручного запуска
- ✅ Аналитика за неделю
- ✅ Аналитика за 6 месяцев
- ✅ CI/CD интеграция

## Конфигурация через .env

### Переменные окружения

```env
# Тарифный план клиента
SUBSCRIPTION_PLAN=start|standard|pro

# Telegram Bot (только для STANDARD и PRO)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_REPORT_CHAT_ID=your_chat_id_here

# Email уведомления (все тарифы)
SEND_EMAIL_REPORTS=true
EMAIL_FOR_REPORTS=["admin@company.com", "qa@company.com"]

# Настройки сервера
THIS_ORIGIN=http://localhost:3000
PORT=3000
DATABASE_URL="file:./dev.db"
```

### Примеры конфигурации

#### START тариф (только email):
```env
SUBSCRIPTION_PLAN=start
SEND_EMAIL_REPORTS=true
EMAIL_FOR_REPORTS=["admin@company.com"]
```

#### STANDARD тариф (email + telegram + ручной запуск):
```env
SUBSCRIPTION_PLAN=standard
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_REPORT_CHAT_ID=your_chat_id
SEND_EMAIL_REPORTS=true
EMAIL_FOR_REPORTS=["admin@company.com", "qa@company.com"]
```

#### PRO тариф (все функции + CI/CD):
```env
SUBSCRIPTION_PLAN=pro
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_REPORT_CHAT_ID=your_chat_id
SEND_EMAIL_REPORTS=true
EMAIL_FOR_REPORTS=["admin@company.com", "qa@company.com", "dev@company.com"]
```

## API для CI/CD (только PRO тариф)

### Получение спецификации API
```bash
GET /api/bot/api-spec
```

### Доступные эндпоинты

#### Запуск всех тестов
```bash
POST /api/bot/run_test/all
Content-Type: application/json

{
  "browser": "Chrome"
}
```

#### Получение отчетов
```bash
GET /api/bot/get_reports
```

#### Получение аналитики
```bash
GET /api/bot/get_analytics/day
GET /api/bot/get_analytics/week
GET /api/bot/get_analytics/month    # только PRO
GET /api/bot/get_analytics/6months  # только PRO
```

#### Статус системы
```bash
GET /api/bot/status
```

## Развертывание

### Один клиент = один сервер

Для каждого клиента создается отдельный сервер с собственной конфигурацией:

1. **Клонируйте репозиторий** для каждого клиента
2. **Настройте .env файл** с соответствующим тарифом
3. **Запустите сервер** с уникальным портом
4. **Настройте домен** для каждого клиента

### Пример развертывания

```bash
# Клиент 1 - START тариф
mkdir client1
cd client1
cp -r freshqa_server/* .
echo "SUBSCRIPTION_PLAN=start" > .env
echo "SEND_EMAIL_REPORTS=true" >> .env
echo "EMAIL_FOR_REPORTS=[\"client1@example.com\"]" >> .env
npm start

# Клиент 2 - PRO тариф
mkdir client2
cd client2
cp -r freshqa_server/* .
echo "SUBSCRIPTION_PLAN=pro" > .env
echo "TELEGRAM_BOT_TOKEN=client2_bot_token" >> .env
echo "TELEGRAM_REPORT_CHAT_ID=client2_chat_id" >> .env
echo "SEND_EMAIL_REPORTS=true" >> .env
echo "EMAIL_FOR_REPORTS=[\"client2@example.com\"]" >> .env
npm start
```

## Безопасность

- Каждый клиент имеет изолированный сервер
- API ключи и токены уникальны для каждого клиента
- Нет доступа к данным других клиентов
- Все функции проверяются на уровне тарифа 