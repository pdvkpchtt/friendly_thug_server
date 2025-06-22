const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Создает новую страницу.
 * @param {string} title - Название страницы.
 * @param {string} url - URL страницы.
 * @param {number} viewport - viewport.
 * @param {string} projectId - ID проекта, к которому привязана страница.
 * @returns {Promise<Object>} - Созданная страница.
 */
const createPage = async (title, url, viewport, projectId) => {
  try {
    const page = await prisma.page.create({
      data: {
        title,
        url,
        project: {
          connect: {
            id: projectId,
          },
        },
        viewport: { connect: { id: viewport?.id } },
      },
      include: {
        Folder: {
          include: {
            children: {
              include: {
                Tests: true,
                children: { include: { Tests: true, children: true } },
              },
            },
          },
        },
        Test: true,
        viewport: true,
      },
    });
    return page;
  } catch (error) {
    console.error("Error creating page:", error);
    throw error;
  }
};

/**
 * Получает страницу по ID.
 * @param {string} pageId - ID страницы.
 * @returns {Promise<Object>} - Найденная страница.
 */
const getPageById = async (pageId) => {
  try {
    const page = await prisma.page.findUnique({
      where: {
        id: pageId,
      },
    });
    return page;
  } catch (error) {
    console.error("Error fetching page:", error);
    throw error;
  }
};

/**
 * Получает все страницы для указанного проекта.
 * @param {string} projectId - ID проекта.
 * @returns {Promise<Array>} - Список страниц.
 */
const getPagesByProjectId = async (projectId, input) => {
  try {
    const pages = await prisma.page.findMany({
      where: {
        projectId,
        title: {
          contains: input?.toLowerCase(),
        },
      },
      include: {
        Folder: {
          include: {
            children: {
              include: {
                Tests: true,
                children: { include: { Tests: true, children: true } },
              },
            },
          },
        },
        Test: true,
        viewport: true,
      },
    });
    return pages;
  } catch (error) {
    console.error("Error fetching pages:", error);
    throw error;
  }
};

/**
 * Обновляет данные страницы.
 * @param {string} pageId - ID страницы.
 * @param {Object} data - Данные для обновления (title, url, width, height).
 * @returns {Promise<Object>} - Обновленная страница.
 */
const updatePage = async (pageId, data) => {
  try {
    const page = await prisma.page.update({
      where: {
        id: pageId,
      },
      data,
    });
    return page;
  } catch (error) {
    console.error("Error updating page:", error);
    throw error;
  }
};

/**
 * Удаляет страницу по ID.
 * @param {string} pageId - ID страницы.
 * @returns {Promise<Object>} - Удаленная страница.
 */
const deletePage = async (pageId) => {
  try {
    const page = await prisma.page.delete({
      where: {
        id: pageId,
      },
    });
    return page;
  } catch (error) {
    console.error("Error deleting page:", error);
    throw error;
  }
};

module.exports = {
  createPage,
  getPageById,
  getPagesByProjectId,
  updatePage,
  deletePage,
};
