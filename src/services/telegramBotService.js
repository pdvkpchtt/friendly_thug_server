const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const temp = require('temp');
const axios = require('axios');

// Автоматически отслеживаем и очищаем временные файлы
temp.track();

// Функция для логирования
const logBot = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[TELEGRAM_BOT] ${timestamp} - ${message}`;
  console.log(logMessage);
  if (data) {
    console.log('[TELEGRAM_BOT] Data:', JSON.stringify(data, null, 2));
  }
};

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isRunning = false;
  }

  async initialize() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      logBot('TELEGRAM_BOT_TOKEN не найден в переменных окружения. Бот не будет запущен.');
      return;
    }

    try {
      logBot('Инициализация Telegram бота...');
      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
      this.setupHandlers();
      this.isRunning = true;
      logBot('Telegram бот успешно инициализирован');
    } catch (error) {
      logBot('Ошибка при инициализации Telegram бота:', error.message);
    }
  }

  setupHandlers() {
    logBot('Настройка обработчиков команд...');
    
    // Команда /start
    this.bot.onText(/\/start/, this.handleStart.bind(this));

    // Команда /runtests
    this.bot.onText(/\/runtests/, this.handleRunTests.bind(this));

    // Команда /analysis
    this.bot.onText(/\/analysis/, this.handleAnalysis.bind(this));

    // Команда /subscription
    this.bot.onText(/\/subscription/, this.handleSubscription.bind(this));

    // Обработка текстовых сообщений
    this.bot.on('message', this.handleMessage.bind(this));

    // Установка команд меню
    this.setCommands();
    
    logBot('Обработчики команд настроены');
  }

  async setCommands() {
    try {
      await this.bot.setMyCommands([
        { command: 'start', description: 'Начать работу с ботом' },
        { command: 'runtests', description: 'Запустить все тесты' },
        { command: 'analysis', description: 'Показать аналитику' },
        { command: 'subscription', description: 'Информация о подписке' }
      ]);
      logBot('Команды меню установлены');
    } catch (error) {
      logBot('Ошибка при установке команд:', error.message);
    }
  }

  async handleStart(msg) {
    const chatId = msg.chat.id;
    logBot(`Получена команда /start от пользователя ${msg.from?.id}`);
    
    const keyboard = {
      reply_markup: {
        keyboard: [
          ['Запуск тестов', 'Аналитика'],
          ['План подписки']
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };

    await this.bot.sendMessage(chatId, 'Выберите действие:', keyboard);
    logBot(`Отправлено приветственное сообщение пользователю ${msg.from?.id}`);
  }

  async handleRunTests(msg) {
    const chatId = msg.chat.id;
    logBot(`Получена команда /runtests от пользователя ${msg.from?.id}`);
    
    await this.bot.sendMessage(chatId, 'Тесты запущены, ожидайте');
    await this.startTests(chatId);
  }

  async handleAnalysis(msg) {
    const chatId = msg.chat.id;
    logBot(`Получена команда /analysis от пользователя ${msg.from?.id}`);
    
    await this.showAnalysis(chatId);
  }

  async handleSubscription(msg) {
    const chatId = msg.chat.id;
    logBot(`Получена команда /subscription от пользователя ${msg.from?.id}`);
    
    await this.showSubscription(chatId);
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    logBot(`Получено сообщение от пользователя ${msg.from?.id}: ${text}`);

    if (text === 'Запуск тестов') {
      await this.bot.sendMessage(chatId, 'Тесты запущены, ожидайте');
      await this.startTests(chatId);
    } else if (text === 'Аналитика') {
      await this.showAnalysis(chatId);
    } else if (text === 'План подписки') {
      await this.showSubscription(chatId);
    } else if (text === 'Отчет за день' || text === 'Отчет за неделю' || 
               text === 'Отчет за месяц' || text === 'Отчет за пол года') {
      await this.bot.sendMessage(chatId, `Вы выбрали: ${text}`);
      await this.getAnalytics(chatId, text);
    } else if (text && !text.startsWith('/')) {
      await this.bot.sendMessage(chatId, 'Неизвестная команда');
    }
  }

  async showAnalysis(chatId) {
    const keyboard = {
      reply_markup: {
        keyboard: [
          ['Отчет за день', 'Отчет за неделю'],
          ['Отчет за месяц', 'Отчет за пол года']
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };
    await this.bot.sendMessage(chatId, 'Выберите период аналитики:', keyboard);
  }

  async showSubscription(chatId) {
    await this.bot.sendMessage(chatId, 'Активирована Кнопка 3\nПлан подписки показали');
  }

  async startTests(chatId) {
    logBot(`Запуск тестов для чата ${chatId}`);
    
    try {
      // Сначала запускаем тесты
      logBot('Отправка запроса на запуск тестов...');
      const runResponse = await axios.get(`${process.env.THIS_ORIGIN || 'http://localhost:3000'}/api/bot/run_test/all`);
      
      logBot('Ответ на запуск тестов:', runResponse.data);
      
      if (runResponse.data.status === 'error') {
        if (runResponse.data.data === 'Some tests is running') {
          await this.bot.sendMessage(chatId, 'Тесты уже запущены\nОжидайте');
          return;
        }
        await this.bot.sendMessage(chatId, 'При запуске тестов произошла ошибка');
        return;
      }

      if (runResponse.data.status === 'progress') {
        await this.bot.sendMessage(chatId, runResponse.data.data);
        
        // Ждем завершения тестов и получаем отчеты
        logBot('Ожидание завершения тестов...');
        await this.waitForReportsAndSend(chatId);
        return;
      }

      // Если сразу получили отчеты
      if (runResponse.data.status === 'success' && runResponse.data.data) {
        await this.sendReports(chatId, runResponse.data.data);
      }

    } catch (error) {
      logBot('Ошибка при запуске тестов:', error.message);
      await this.bot.sendMessage(chatId, 'При запуске тестов произошла ошибка');
    }
  }

  async waitForReportsAndSend(chatId) {
    logBot(`Ожидание отчетов для чата ${chatId}`);
    
    let attempts = 0;
    const maxAttempts = 30; // 30 попыток по 10 секунд = 5 минут
    
    while (attempts < maxAttempts) {
      try {
        logBot(`Попытка получения отчетов ${attempts + 1}/${maxAttempts} для чата ${chatId}`);
        
        const reportsResponse = await axios.get(`${process.env.THIS_ORIGIN || 'http://localhost:3000'}/api/bot/get_reports`);
        
        if (reportsResponse.data.status === 'success' && reportsResponse.data.data && reportsResponse.data.data.length > 0) {
          logBot(`Получено отчетов: ${reportsResponse.data.data.length} для чата ${chatId}`);
          await this.sendReports(chatId, reportsResponse.data.data);
          return;
        } else {
          logBot(`Отчеты еще не готовы для чата ${chatId}, ожидание...`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Ждем 10 секунд
          attempts++;
        }
      } catch (error) {
        logBot(`Ошибка при получении отчетов для чата ${chatId}:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
    }
    
    logBot(`Превышено время ожидания отчетов для чата ${chatId}`);
    await this.bot.sendMessage(chatId, 'Не удалось получить отчеты в отведенное время');
  }

  async sendReports(chatId, reports) {
    logBot(`Отправка ${reports.length} отчетов в чат ${chatId}`);
    
    for (let i = 0; i < reports.length; i++) {
      const testData = reports[i];
      const reportText = this.formatReport(testData, i);
      
      try {
        await this.bot.sendMessage(chatId, reportText, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });
        logBot(`Отправлен текстовый отчет ${i + 1}/${reports.length} в чат ${chatId}`);

        // Отправляем скриншоты
        if (testData.Report && testData.Report[0] && testData.Report[0].ReportStep) {
          const screenshots = [];
          
          for (const step of testData.Report[0].ReportStep) {
            if (step.Screenshot && step.Screenshot.data) {
              const imageBuffer = Buffer.from(step.Screenshot.data, 'base64');
              const tempFile = temp.path({ suffix: '.png' });
              fs.writeFileSync(tempFile, imageBuffer);
              
              screenshots.push({
                type: 'photo',
                media: fs.createReadStream(tempFile)
              });
            }
          }

          if (screenshots.length > 0) {
            await this.bot.sendMediaGroup(chatId, screenshots);
            logBot(`Отправлено ${screenshots.length} скриншотов для отчета ${i + 1} в чат ${chatId}`);
          }
        }
      } catch (error) {
        logBot(`Ошибка при отправке отчета ${i + 1} в чат ${chatId}:`, error.message);
      }
    }
    
    logBot(`Все отчеты отправлены в чат ${chatId}`);
  }

  async getAnalytics(chatId, period) {
    logBot(`Получение аналитики за период "${period}" для чата ${chatId}`);
    
    try {
      const response = await axios.get(`${process.env.THIS_ORIGIN || 'http://localhost:3000'}/api/bot/get_analytics/${encodeURIComponent(period)}`);
      
      if (response.data.status === 'error') {
        await this.bot.sendMessage(chatId, 'При получении аналитики произошла ошибка');
        return;
      }

      const analyticsText = this.formatAnalytics(response.data.data);
      await this.bot.sendMessage(chatId, analyticsText, { parse_mode: 'Markdown' });
      logBot(`Аналитика отправлена в чат ${chatId}`);

    } catch (error) {
      logBot(`Ошибка при получении аналитики для чата ${chatId}:`, error.message);
      await this.bot.sendMessage(chatId, 'При получении аналитики произошла ошибка');
    }
  }

  formatReport(testData, index) {
    if (!testData.Report || testData.Report.length === 0) {
      return `Тест ${index + 1}: Нет данных отчета`;
    }

    const report = testData.Report[0];
    let result = `**Тест ${index + 1}**\n`;
    result += `Название: ${testData.title || 'Не указано'}\n`;
    result += `Статус: ${report.status || 'Неизвестно'}\n`;
    result += `Время выполнения: ${report.executionTime || 'Не указано'}\n\n`;

    if (report.ReportStep && report.ReportStep.length > 0) {
      result += '**Шаги выполнения:**\n';
      report.ReportStep.forEach((step, stepIndex) => {
        result += `${stepIndex + 1}. ${step.description || 'Шаг без описания'}\n`;
        result += `   Статус: ${step.status || 'Неизвестно'}\n`;
        if (step.error) {
          result += `   Ошибка: ${step.error}\n`;
        }
        result += '\n';
      });
    }

    return result;
  }

  formatAnalytics(data) {
    if (!data || Object.keys(data).length === 0) {
      return 'Нет данных для отображения';
    }

    let result = '**Аналитика**\n\n';
    
    if (data.totalTests !== undefined) {
      result += `Всего тестов: ${data.totalTests}\n`;
    }
    if (data.passedTests !== undefined) {
      result += `Пройдено: ${data.passedTests}\n`;
    }
    if (data.failedTests !== undefined) {
      result += `Провалено: ${data.failedTests}\n`;
    }
    if (data.successRate !== undefined) {
      result += `Процент успеха: ${data.successRate}%\n`;
    }
    if (data.averageExecutionTime !== undefined) {
      result += `Среднее время выполнения: ${data.averageExecutionTime}мс\n`;
    }

    return result;
  }

  async stop() {
    if (this.bot) {
      logBot('Остановка Telegram бота...');
      await this.bot.stopPolling();
      this.isRunning = false;
      logBot('Telegram бот остановлен');
    }
  }

  isBotRunning() {
    return this.isRunning;
  }
}

module.exports = new TelegramBotService(); 