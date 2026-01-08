/**
 * Recipe Master - Digital Culinary Workstation
 * A single-page application for discovering and curating recipes
 * Using TheMealDB API and File System Access API
 */

// ============================================
// Application State
// ============================================
const state = {
  searchResults: [],
  cookbook: [],
  categories: [],
  currentRecipe: null,
  activeCategory: null,
  isLoading: false,
  isSidebarOpen: false
};

// ============================================
// DOM Elements
// ============================================
const elements = {
  // Search
  searchInput: document.getElementById('search-input'),
  searchBtn: document.getElementById('search-btn'),
  clearSearchBtn: document.querySelector('.cds--search-close'),

  // Results
  recipeGrid: document.getElementById('recipe-grid'),
  resultsTitle: document.getElementById('results-title'),
  loading: document.getElementById('loading'),
  messageContainer: document.getElementById('message-container'),
  messageTitle: document.getElementById('message-title'),
  messageSubtitle: document.getElementById('message-subtitle'),

  // Categories
  categoriesContainer: document.getElementById('categories-container'),
  categoriesLoading: document.getElementById('categories-loading'),

  // Sidebar
  cookbookSidebar: document.getElementById('cookbook-sidebar'),
  toggleCookbookBtn: document.getElementById('toggle-cookbook-btn'),
  closeSidebarBtn: document.getElementById('close-sidebar-btn'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  cookbookList: document.getElementById('cookbook-list'),
  emptyCookbook: document.getElementById('empty-cookbook'),
  cookbookCount: document.getElementById('cookbook-count'),
  exportBtn: document.getElementById('export-btn'),
  clearCookbookBtn: document.getElementById('clear-cookbook-btn'),

  // Modal
  recipeModal: document.getElementById('recipe-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalContent: document.getElementById('modal-content'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalCancelBtn: document.getElementById('modal-cancel-btn'),
  modalSaveBtn: document.getElementById('modal-save-btn'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

// ============================================
// API Configuration
// ============================================
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// ============================================
// API Functions
// ============================================

/**
 * Search for meals by ingredient/name
 * @param {string} searchTerm - The search term
 * @returns {Promise<Array>} - Array of meal objects
 */
async function searchMeals(searchTerm) {
  try {
    const response = await fetch(`${API_BASE_URL}/search.php?s=${encodeURIComponent(searchTerm)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error('Error fetching meals:', error);
    throw error;
  }
}

/**
 * Get detailed meal information by ID
 * @param {string} mealId - The meal ID
 * @returns {Promise<Object>} - Meal object
 */
async function getMealById(mealId) {
  try {
    const response = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    console.error('Error fetching meal details:', error);
    throw error;
  }
}

/**
 * Fetch all meal categories
 * @returns {Promise<Array>} - Array of category objects
 */
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Fetch meals by category
 * @param {string} category - The category name
 * @returns {Promise<Array>} - Array of meal objects (limited info)
 */
async function fetchMealsByCategory(category) {
  try {
    const response = await fetch(`${API_BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error('Error fetching meals by category:', error);
    throw error;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Parse ingredients from meal object
 * TheMealDB has strIngredient1-20 and strMeasure1-20
 * @param {Object} meal - The meal object from API
 * @returns {Array} - Array of {ingredient, measure} objects
 */
function parseIngredients(meal) {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];

    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure ? measure.trim() : ''
      });
    }
  }

  return ingredients;
}

/**
 * Check if a meal is in the cookbook
 * @param {string} mealId - The meal ID
 * @returns {boolean}
 */
function isInCookbook(mealId) {
  return state.cookbook.some(meal => meal.idMeal === mealId);
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// Toast Notifications
// ============================================

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type: 'success', 'error', 'info'
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = {
    success: '<svg class="toast__icon" width="20" height="20" viewBox="0 0 32 32"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm-2 19.59l-5-5L10.59 15 14 18.41 21.41 11 23 12.59z"/></svg>',
    error: '<svg class="toast__icon" width="20" height="20" viewBox="0 0 32 32"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm5.29 17.29a1 1 0 0 1-1.42 1.42L16 16.41l-3.88 3.88a1 1 0 1 1-1.41-1.41L14.59 15l-3.88-3.88a1 1 0 0 1 1.41-1.41L16 13.59l3.88-3.88a1 1 0 0 1 1.41 1.41L17.41 15z"/></svg>',
    info: '<svg class="toast__icon" width="20" height="20" viewBox="0 0 32 32"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 6a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 16 8zm4 16h-8v-2h3v-6h-2v-2h4v8h3z"/></svg>'
  };

  toast.innerHTML = `
    ${icons[type]}
    <span class="toast__message">${message}</span>
    <button class="toast__close" aria-label="Close notification">
      <svg width="16" height="16" viewBox="0 0 32 32">
        <path d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z"/>
      </svg>
    </button>
  `;

  elements.toastContainer.appendChild(toast);

  // Close button handler
  toast.querySelector('.toast__close').addEventListener('click', () => {
    toast.remove();
  });

  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// ============================================
// UI State Management
// ============================================

/**
 * Show loading state
 */
function showLoading() {
  state.isLoading = true;
  elements.loading.classList.remove('hidden');
  elements.messageContainer.classList.add('hidden');
  elements.resultsTitle.classList.add('hidden');
  elements.recipeGrid.innerHTML = '';
}

/**
 * Hide loading state
 */
function hideLoading() {
  state.isLoading = false;
  elements.loading.classList.add('hidden');
}

/**
 * Show message (error/empty state)
 * @param {string} title - Message title
 * @param {string} subtitle - Message subtitle
 */
function showMessage(title, subtitle) {
  elements.messageTitle.textContent = title;
  elements.messageSubtitle.textContent = subtitle;
  elements.messageContainer.classList.remove('hidden');
  elements.resultsTitle.classList.add('hidden');
}

/**
 * Hide message
 */
function hideMessage() {
  elements.messageContainer.classList.add('hidden');
}

/**
 * Toggle sidebar
 * @param {boolean} open - Whether to open or close
 */
function toggleSidebar(open) {
  state.isSidebarOpen = open;

  if (open) {
    elements.cookbookSidebar.classList.add('open');
    elements.sidebarOverlay.classList.add('visible');
    document.querySelector('.main-content').classList.add('sidebar-open');
  } else {
    elements.cookbookSidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('visible');
    document.querySelector('.main-content').classList.remove('sidebar-open');
  }
}

/**
 * Toggle modal
 * @param {boolean} visible - Whether to show or hide
 */
function toggleModal(visible) {
  if (visible) {
    elements.recipeModal.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  } else {
    elements.recipeModal.classList.remove('is-visible');
    document.body.style.overflow = '';
    state.currentRecipe = null;
  }
}

// ============================================
// DOM Rendering Functions
// ============================================

/**
 * Create a recipe card element
 * @param {Object} meal - The meal object
 * @returns {HTMLElement}
 */
function createRecipeCard(meal) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.dataset.mealId = meal.idMeal;

  const isSaved = isInCookbook(meal.idMeal);

  card.innerHTML = `
    <div class="recipe-card__image-container">
      <img
        class="recipe-card__image"
        src="${meal.strMealThumb}"
        alt="${meal.strMeal}"
        loading="lazy"
      >
      <span class="recipe-card__category">${meal.strCategory || 'Uncategorized'}</span>
    </div>
    <div class="recipe-card__content">
      <h3 class="recipe-card__title">${meal.strMeal}</h3>
      <p class="recipe-card__area">${meal.strArea || 'International'} Cuisine</p>
      <div class="recipe-card__actions">
        <button class="cds--btn cds--btn--ghost recipe-card__btn recipe-card__btn--view" data-action="view">
          View Recipe
        </button>
        <button
          class="cds--btn recipe-card__btn recipe-card__btn--save ${isSaved ? 'saved' : ''}"
          data-action="save"
          ${isSaved ? 'title="Already in cookbook"' : 'title="Add to cookbook"'}
        >
          ${isSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  `;

  return card;
}

/**
 * Render recipe cards to the grid
 * @param {Array} meals - Array of meal objects
 * @param {string} titleText - Optional custom title text
 */
function renderRecipeCards(meals, titleText = null) {
  elements.recipeGrid.innerHTML = '';

  if (meals.length === 0) {
    return;
  }

  const title = titleText || (state.activeCategory
    ? `${state.activeCategory} Recipes (${meals.length})`
    : `Search Results (${meals.length} recipes found)`);

  elements.resultsTitle.textContent = title;
  elements.resultsTitle.classList.remove('hidden');

  meals.forEach(meal => {
    const card = createRecipeCard(meal);
    elements.recipeGrid.appendChild(card);
  });
}

/**
 * Create a category card element
 * @param {Object} category - The category object
 * @returns {HTMLElement}
 */
function createCategoryCard(category) {
  const card = document.createElement('div');
  card.className = 'category-card';
  card.dataset.category = category.strCategory;

  const isActive = state.activeCategory === category.strCategory;
  if (isActive) {
    card.classList.add('active');
  }

  card.innerHTML = `
    <img
      class="category-card__image"
      src="${category.strCategoryThumb}"
      alt="${category.strCategory}"
      loading="lazy"
    >
    <p class="category-card__name">${category.strCategory}</p>
  `;

  return card;
}

/**
 * Render categories to the container
 * @param {Array} categories - Array of category objects
 */
function renderCategories(categories) {
  elements.categoriesLoading.classList.add('hidden');
  elements.categoriesContainer.classList.remove('hidden');
  elements.categoriesContainer.innerHTML = '';

  categories.forEach(category => {
    const card = createCategoryCard(category);
    elements.categoriesContainer.appendChild(card);
  });
}

/**
 * Update active state on category cards
 * @param {string|null} activeCategory - The active category name or null
 */
function updateCategoryActiveState(activeCategory) {
  const cards = elements.categoriesContainer.querySelectorAll('.category-card');
  cards.forEach(card => {
    const isActive = card.dataset.category === activeCategory;
    card.classList.toggle('active', isActive);
  });
}

/**
 * Create a cookbook list item
 * @param {Object} meal - The meal object
 * @returns {HTMLElement}
 */
function createCookbookItem(meal) {
  const item = document.createElement('li');
  item.className = 'cookbook-item';
  item.dataset.mealId = meal.idMeal;

  item.innerHTML = `
    <img class="cookbook-item__image" src="${meal.strMealThumb}/preview" alt="${meal.strMeal}">
    <div class="cookbook-item__info">
      <h4 class="cookbook-item__title">${meal.strMeal}</h4>
      <p class="cookbook-item__category">${meal.strCategory || 'Uncategorized'}</p>
    </div>
    <button class="cookbook-item__delete" data-action="delete" aria-label="Remove from cookbook">
      <svg width="16" height="16" viewBox="0 0 32 32">
        <path d="M12 12h2v12h-2zM18 12h2v12h-2z"/>
        <path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20zM12 2h8v2h-8z"/>
      </svg>
    </button>
  `;

  return item;
}

/**
 * Render the cookbook sidebar list
 */
function renderCookbook() {
  elements.cookbookList.innerHTML = '';

  if (state.cookbook.length === 0) {
    elements.emptyCookbook.classList.remove('hidden');
    elements.cookbookList.classList.add('hidden');
    elements.exportBtn.disabled = true;
    elements.clearCookbookBtn.disabled = true;
  } else {
    elements.emptyCookbook.classList.add('hidden');
    elements.cookbookList.classList.remove('hidden');
    elements.exportBtn.disabled = false;
    elements.clearCookbookBtn.disabled = false;

    state.cookbook.forEach(meal => {
      const item = createCookbookItem(meal);
      elements.cookbookList.appendChild(item);
    });
  }

  // Update count in header
  elements.cookbookCount.textContent = state.cookbook.length;
}

/**
 * Render recipe details in modal
 * @param {Object} meal - The meal object
 */
function renderRecipeModal(meal) {
  state.currentRecipe = meal;
  elements.modalTitle.textContent = meal.strMeal;

  const ingredients = parseIngredients(meal);
  const isSaved = isInCookbook(meal.idMeal);

  elements.modalContent.innerHTML = `
    <img class="modal-recipe-image" src="${meal.strMealThumb}" alt="${meal.strMeal}">

    <div class="modal-section">
      <h4>Details</h4>
      <div class="modal-meta">
        <div class="modal-meta-item">
          <strong>Category:</strong> ${meal.strCategory || 'N/A'}
        </div>
        <div class="modal-meta-item">
          <strong>Cuisine:</strong> ${meal.strArea || 'International'}
        </div>
        ${meal.strTags ? `<div class="modal-meta-item"><strong>Tags:</strong> ${meal.strTags}</div>` : ''}
      </div>
    </div>

    <div class="modal-section">
      <h4>Ingredients</h4>
      <ul class="ingredients-list">
        ${ingredients.map(({ ingredient, measure }) => `
          <li>${measure} ${ingredient}</li>
        `).join('')}
      </ul>
    </div>

    <div class="modal-section">
      <h4>Instructions</h4>
      <p class="instructions-text">${meal.strInstructions || 'No instructions available.'}</p>
    </div>

    ${meal.strYoutube ? `
      <div class="modal-section">
        <h4>Video Tutorial</h4>
        <a href="${meal.strYoutube}" target="_blank" rel="noopener noreferrer" class="cds--btn cds--btn--tertiary">
          Watch on YouTube
        </a>
      </div>
    ` : ''}
  `;

  // Update save button state
  elements.modalSaveBtn.textContent = isSaved ? 'Already Saved' : 'Save to Cookbook';
  elements.modalSaveBtn.disabled = isSaved;

  if (isSaved) {
    elements.modalSaveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 32 32" style="margin-right: 8px;">
        <path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm-2 19.59l-5-5L10.59 15 14 18.41 21.41 11 23 12.59z"/>
      </svg>
      Already Saved
    `;
  } else {
    elements.modalSaveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 32 32" style="margin-right: 8px;">
        <path d="M22.5 4c-2 0-3.9.8-5.3 2.2L16 7.4l-1.1-1.1C12 3.3 7.2 3.3 4.3 6.2 1.3 9.2 1.3 14 4.2 17l11.1 11.1c.4.4 1 .4 1.4 0L27.8 17c2.9-3 2.9-7.8 0-10.8-1.4-1.4-3.3-2.2-5.3-2.2z"/>
      </svg>
      Save to Cookbook
    `;
  }

  toggleModal(true);
}

/**
 * Update save button state on a specific card
 * @param {string} mealId - The meal ID
 * @param {boolean} saved - Whether it's saved
 */
function updateCardSaveButton(mealId, saved) {
  const card = elements.recipeGrid.querySelector(`[data-meal-id="${mealId}"]`);
  if (card) {
    const saveBtn = card.querySelector('[data-action="save"]');
    if (saveBtn) {
      saveBtn.classList.toggle('saved', saved);
      saveBtn.textContent = saved ? 'Saved' : 'Save';
      saveBtn.title = saved ? 'Already in cookbook' : 'Add to cookbook';
    }
  }
}

// ============================================
// Cookbook Management
// ============================================

/**
 * Add a meal to the cookbook
 * @param {Object} meal - The meal object
 */
function addToCookbook(meal) {
  if (isInCookbook(meal.idMeal)) {
    showToast('This recipe is already in your cookbook', 'info');
    return;
  }

  state.cookbook.push(meal);
  renderCookbook();
  updateCardSaveButton(meal.idMeal, true);
  showToast(`"${meal.strMeal}" added to cookbook`, 'success');

  // Save to localStorage
  saveCookbookToStorage();
}

/**
 * Remove a meal from the cookbook
 * @param {string} mealId - The meal ID
 */
function removeFromCookbook(mealId) {
  const index = state.cookbook.findIndex(meal => meal.idMeal === mealId);

  if (index > -1) {
    const meal = state.cookbook[index];
    state.cookbook.splice(index, 1);
    renderCookbook();
    updateCardSaveButton(mealId, false);
    showToast(`"${meal.strMeal}" removed from cookbook`, 'info');

    // Save to localStorage
    saveCookbookToStorage();
  }
}

/**
 * Clear all recipes from cookbook
 */
function clearCookbook() {
  if (state.cookbook.length === 0) return;

  if (confirm('Are you sure you want to clear your entire cookbook?')) {
    const mealIds = state.cookbook.map(meal => meal.idMeal);
    state.cookbook = [];
    renderCookbook();

    // Update all card buttons
    mealIds.forEach(id => updateCardSaveButton(id, false));

    showToast('Cookbook cleared', 'info');
    saveCookbookToStorage();
  }
}

/**
 * Save cookbook to localStorage
 */
function saveCookbookToStorage() {
  try {
    localStorage.setItem('recipeMaster_cookbook', JSON.stringify(state.cookbook));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Load cookbook from localStorage
 */
function loadCookbookFromStorage() {
  try {
    const saved = localStorage.getItem('recipeMaster_cookbook');
    if (saved) {
      state.cookbook = JSON.parse(saved);
      renderCookbook();
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    state.cookbook = [];
  }
}

// ============================================
// File Export (File System Access API)
// ============================================

/**
 * Format cookbook data for export
 * @param {string} format - 'txt' or 'json'
 * @returns {string}
 */
function formatCookbookForExport(format = 'txt') {
  if (format === 'json') {
    return JSON.stringify(state.cookbook.map(meal => ({
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      instructions: meal.strInstructions,
      thumbnail: meal.strMealThumb,
      ingredients: parseIngredients(meal)
    })), null, 2);
  }

  // Text format
  let content = '========================================\n';
  content += '        MY RECIPE COOKBOOK\n';
  content += '   Exported from Recipe Master\n';
  content += `   Date: ${new Date().toLocaleDateString()}\n`;
  content += '========================================\n\n';

  state.cookbook.forEach((meal, index) => {
    const ingredients = parseIngredients(meal);

    content += `----------------------------------------\n`;
    content += `Recipe ${index + 1}: ${meal.strMeal}\n`;
    content += `----------------------------------------\n\n`;

    content += `Category: ${meal.strCategory || 'N/A'}\n`;
    content += `Cuisine: ${meal.strArea || 'International'}\n\n`;

    content += `INGREDIENTS:\n`;
    ingredients.forEach(({ ingredient, measure }) => {
      content += `  - ${measure} ${ingredient}\n`;
    });

    content += `\nINSTRUCTIONS:\n`;
    content += `${meal.strInstructions || 'No instructions available.'}\n\n`;

    if (meal.strYoutube) {
      content += `Video: ${meal.strYoutube}\n\n`;
    }

    content += '\n';
  });

  content += '========================================\n';
  content += '  Thank you for using Recipe Master!\n';
  content += '========================================\n';

  return content;
}

/**
 * Export cookbook using File System Access API
 */
async function exportCookbook() {
  if (state.cookbook.length === 0) {
    showToast('Your cookbook is empty. Add some recipes first!', 'error');
    return;
  }

  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      const options = {
        suggestedName: 'my-cookbook',
        types: [
          {
            description: 'Text File',
            accept: { 'text/plain': ['.txt'] }
          },
          {
            description: 'JSON File',
            accept: { 'application/json': ['.json'] }
          }
        ]
      };

      const fileHandle = await window.showSaveFilePicker(options);
      const fileName = fileHandle.name;
      const format = fileName.endsWith('.json') ? 'json' : 'txt';

      const content = formatCookbookForExport(format);

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      showToast(`Cookbook exported successfully as ${fileName}`, 'success');
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled the save dialog
        return;
      }
      console.error('Error exporting cookbook:', error);
      showToast('Failed to export cookbook. Please try again.', 'error');
    }
  } else {
    // Fallback for browsers that don't support File System Access API
    fallbackExport();
  }
}

/**
 * Fallback export method using download link
 */
function fallbackExport() {
  const content = formatCookbookForExport('txt');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `my-cookbook-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  showToast('Cookbook downloaded successfully', 'success');
}

// ============================================
// Category Functionality
// ============================================

/**
 * Load and display categories on app init
 */
async function loadCategories() {
  try {
    const categories = await fetchCategories();
    state.categories = categories;
    renderCategories(categories);
  } catch (error) {
    console.error('Failed to load categories:', error);
    elements.categoriesLoading.innerHTML = `
      <span style="color: var(--cds-red-60);">Failed to load categories. Please refresh the page.</span>
    `;
  }
}

/**
 * Select a category and display its meals
 * @param {string} categoryName - The category name
 */
async function selectCategory(categoryName) {
  // If clicking the same category, deselect it
  if (state.activeCategory === categoryName) {
    clearActiveCategory();
    return;
  }

  state.activeCategory = categoryName;
  updateCategoryActiveState(categoryName);

  showLoading();
  hideMessage();

  try {
    // Fetch meals for this category (this returns limited info)
    const meals = await fetchMealsByCategory(categoryName);

    if (meals.length === 0) {
      hideLoading();
      showMessage(
        'No recipes found',
        `No recipes found in the "${categoryName}" category.`
      );
      return;
    }

    // Fetch full details for each meal (in parallel, limited to first 20)
    const mealsToFetch = meals.slice(0, 20);
    const fullMeals = await Promise.all(
      mealsToFetch.map(meal => getMealById(meal.idMeal))
    );

    // Filter out any null results
    const validMeals = fullMeals.filter(meal => meal !== null);

    // Add category info to meals that might be missing it
    validMeals.forEach(meal => {
      if (!meal.strCategory) {
        meal.strCategory = categoryName;
      }
    });

    state.searchResults = validMeals;

    hideLoading();
    renderRecipeCards(validMeals);

    // Scroll to results
    elements.resultsTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (error) {
    hideLoading();
    showMessage(
      'Something went wrong',
      'Unable to fetch recipes for this category. Please try again.'
    );
    showToast('Failed to load category recipes', 'error');
  }
}

/**
 * Clear the active category selection
 */
function clearActiveCategory() {
  state.activeCategory = null;
  updateCategoryActiveState(null);

  // Clear the results
  elements.recipeGrid.innerHTML = '';
  elements.resultsTitle.classList.add('hidden');
  hideMessage();

  // Scroll back to categories
  document.getElementById('categories-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Handle category card clicks
 * @param {Event} event
 */
function handleCategoryClick(event) {
  const card = event.target.closest('.category-card');
  if (!card) return;

  const categoryName = card.dataset.category;
  if (categoryName) {
    selectCategory(categoryName);
  }
}

// ============================================
// Search Functionality
// ============================================

/**
 * Perform recipe search
 */
async function performSearch() {
  const searchTerm = elements.searchInput.value.trim();

  if (!searchTerm) {
    showToast('Please enter a search term', 'info');
    elements.searchInput.focus();
    return;
  }

  // Clear active category when performing a search
  if (state.activeCategory) {
    state.activeCategory = null;
    updateCategoryActiveState(null);
  }

  showLoading();
  hideMessage();

  try {
    const meals = await searchMeals(searchTerm);
    state.searchResults = meals;

    hideLoading();

    if (meals.length === 0) {
      showMessage(
        'No recipes found',
        `We couldn't find any recipes matching "${searchTerm}". Try a different ingredient or dish name.`
      );
    } else {
      renderRecipeCards(meals, `Search Results for "${searchTerm}" (${meals.length} recipes found)`);
    }
  } catch (error) {
    hideLoading();
    showMessage(
      'Something went wrong',
      'Unable to fetch recipes. Please check your internet connection and try again.'
    );
    showToast('Failed to search recipes. Please try again.', 'error');
  }
}

/**
 * Clear search input
 */
function clearSearch() {
  elements.searchInput.value = '';
  elements.clearSearchBtn.classList.add('cds--search-close--hidden');
  elements.searchInput.focus();
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle recipe card clicks (event delegation)
 * @param {Event} event
 */
async function handleCardClick(event) {
  const card = event.target.closest('.recipe-card');
  if (!card) return;

  const action = event.target.closest('[data-action]')?.dataset.action;
  const mealId = card.dataset.mealId;

  if (action === 'view') {
    // Find meal in search results or fetch from API
    let meal = state.searchResults.find(m => m.idMeal === mealId);

    if (!meal) {
      try {
        meal = await getMealById(mealId);
      } catch (error) {
        showToast('Failed to load recipe details', 'error');
        return;
      }
    }

    if (meal) {
      renderRecipeModal(meal);
    }
  } else if (action === 'save') {
    const meal = state.searchResults.find(m => m.idMeal === mealId);
    if (meal) {
      addToCookbook(meal);
    }
  }
}

/**
 * Handle cookbook list clicks (event delegation)
 * @param {Event} event
 */
function handleCookbookClick(event) {
  const deleteBtn = event.target.closest('[data-action="delete"]');
  if (deleteBtn) {
    const item = deleteBtn.closest('.cookbook-item');
    const mealId = item?.dataset.mealId;
    if (mealId) {
      removeFromCookbook(mealId);
    }
  }
}

/**
 * Handle modal save button click
 */
function handleModalSave() {
  if (state.currentRecipe) {
    addToCookbook(state.currentRecipe);

    // Update modal button
    elements.modalSaveBtn.disabled = true;
    elements.modalSaveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 32 32" style="margin-right: 8px;">
        <path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm-2 19.59l-5-5L10.59 15 14 18.41 21.41 11 23 12.59z"/>
      </svg>
      Already Saved
    `;
  }
}

/**
 * Handle search input changes
 */
function handleSearchInput() {
  const hasValue = elements.searchInput.value.length > 0;
  elements.clearSearchBtn.classList.toggle('cds--search-close--hidden', !hasValue);
}

/**
 * Handle keyboard events
 * @param {KeyboardEvent} event
 */
function handleKeydown(event) {
  // Search on Enter
  if (event.key === 'Enter' && event.target === elements.searchInput) {
    event.preventDefault();
    performSearch();
  }

  // Close modal on Escape
  if (event.key === 'Escape') {
    if (elements.recipeModal.classList.contains('is-visible')) {
      toggleModal(false);
    } else if (state.isSidebarOpen) {
      toggleSidebar(false);
    }
  }
}

// ============================================
// Initialize Application
// ============================================

function init() {
  // Load saved cookbook from localStorage
  loadCookbookFromStorage();

  // Load categories on app start
  loadCategories();

  // Search events
  elements.searchBtn.addEventListener('click', performSearch);
  elements.searchInput.addEventListener('input', handleSearchInput);
  elements.clearSearchBtn.addEventListener('click', clearSearch);

  // Category events (event delegation)
  elements.categoriesContainer.addEventListener('click', handleCategoryClick);

  // Sidebar events
  elements.toggleCookbookBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSidebar(!state.isSidebarOpen);
  });
  elements.closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

  // Cookbook events
  elements.cookbookList.addEventListener('click', handleCookbookClick);
  elements.exportBtn.addEventListener('click', exportCookbook);
  elements.clearCookbookBtn.addEventListener('click', clearCookbook);

  // Recipe grid events (event delegation)
  elements.recipeGrid.addEventListener('click', handleCardClick);

  // Modal events
  elements.modalCloseBtn.addEventListener('click', () => toggleModal(false));
  elements.modalCancelBtn.addEventListener('click', () => toggleModal(false));
  elements.modalSaveBtn.addEventListener('click', handleModalSave);
  elements.recipeModal.addEventListener('click', (e) => {
    if (e.target === elements.recipeModal) {
      toggleModal(false);
    }
  });

  // Global keyboard events
  document.addEventListener('keydown', handleKeydown);

  // Focus search input on load
  elements.searchInput.focus();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
