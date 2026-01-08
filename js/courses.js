let courses = [];
let filteredCourses = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

/**
 * Инициализация загрузки курсов
 */
async function initCourses() {
  try {
    courses = await getCourses();
    filteredCourses = courses.slice();
    renderCourses();
    renderPagination();
    initCoursesSearch();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}


/**
 * Отрисовка списка курсов
 */
let selectedCourseId = null;

function renderCourses() {
  const list = document.getElementById("courses-list");
  list.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  const pageCourses = filteredCourses.slice(start, end);

  pageCourses.forEach(course => {
    const li = document.createElement("li");
    li.className = "list-group-item course-item d-flex justify-content-between align-items-center";
    li.textContent = `${course.name} (${course.level})`;
    if (selectedCourseId === course.id) {
      li.classList.add("active");
    }
    li.addEventListener("click", () => {
      selectedCourseId = course.id;
      renderCourses();
    });
    list.appendChild(li);
  });
}

function renderPagination() {
  const pagination = document.getElementById("courses-pagination");
  pagination.innerHTML = "";

  const pagesCount = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  // если курсов нет — просто выходим
  if (pagesCount === 0) return;

  // Previous
  pagination.appendChild(
    createPageItem(
      "Previous",
      currentPage === 1,
      () => {
        currentPage--;
        updateCourses();
      }
    )
  );

  // Номера страниц
  for (let i = 1; i <= pagesCount; i++) {
    pagination.appendChild(
      createPageItem(
        i,
        false,
        () => {
          currentPage = i;
          updateCourses();
        },
        i === currentPage
      )
    );
  }

  // Next
  pagination.appendChild(
    createPageItem(
      "Next",
      currentPage === pagesCount,
      () => {
        currentPage++;
        updateCourses();
      }
    )
  );
}



function applyCoursesFilter() {
  const nameInput = document.querySelector('#courses-search-name');
  const levelSelect = document.querySelector('#courses-search-level');

  const searchName = nameInput ? nameInput.value.trim().toLowerCase() : '';
  const level = levelSelect ? levelSelect.value : '';

  filteredCourses = courses.filter(course => {
    const matchName = !searchName ||
      course.name.toLowerCase().includes(searchName);
    const matchLevel = !level || course.level === level; // пустой level = все уровни
    return matchName && matchLevel;
  });

  currentPage = 1;
  renderCourses();
  renderPagination();
}

function initCoursesSearch() {
  const form = document.querySelector("#courses-search-form");
  const nameInput = document.querySelector("#courses-search-name");
  const levelSelect = document.querySelector("#courses-search-level");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    applyCoursesFilter();
  });

  // Дополнительно: фильтрация «на лету»
  nameInput && nameInput.addEventListener("input", applyCoursesFilter);
  levelSelect && levelSelect.addEventListener("change", applyCoursesFilter);
}


/**
 * Создание кнопки пагинации
 */
function createPageItem(text, disabled, onClick, active = false) {
  const li = document.createElement('li');
  li.className = 'page-item';

  if (disabled) li.classList.add('disabled');
  if (active) li.classList.add('active');

  const element = document.createElement(disabled || active ? 'span' : 'a');
  element.className = 'page-link';
  element.textContent = text;

  if (!disabled && !active) {
    element.href = '#';
    element.addEventListener('click', (e) => {
      e.preventDefault();
      onClick();
    });
  }

  li.appendChild(element);
  return li;
}

/**
 * Обновление списка и пагинации
 */
function updateCourses() {
  renderCourses();
  renderPagination();
}
