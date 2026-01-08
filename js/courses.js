let courses = [];
let filteredCourses = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;
let selectedCourseId = null;


function extractNumberFromCost(costString) {
    if (!costString) return 0;
    const numberString = costString.replace(/[^\d]/g, '');
    const number = parseInt(numberString, 10);
    return isNaN(number) ? 0 : number;
}

function getElementValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function getElementChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function getEndDateFormatted(startDateString, weeks) {
    const endDate = new Date(startDateString);
    endDate.setDate(endDate.getDate() + weeks * 7);
    return endDate.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}


async function initCourses() {
    try {
        courses = await getCourses();
        filteredCourses = courses.slice();
        
        renderCourses();
        renderPagination();
        initCoursesSearch();
        initCourseApplication();
        
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}


function renderCourses() {
    const list = document.getElementById("courses-list");
    if (!list) return;
    
    list.innerHTML = "";
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageCourses = filteredCourses.slice(start, end);
    
    if (pageCourses.length === 0) {
        const li = document.createElement("li");
        li.className = "list-group-item text-center text-muted";
        li.textContent = "Курсы не найдены";
        list.appendChild(li);
        return;
    }
    
    pageCourses.forEach(course => {
        const li = document.createElement("li");
        li.className = "list-group-item course-item d-flex justify-content-between align-items-center";
        li.textContent = `${course.name} (${course.level})`;
        
        if (selectedCourseId === course.id) {
            li.classList.add("active", "fw-bold");
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
    if (!pagination) return;
    
    pagination.innerHTML = "";
    
    const pagesCount = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
    if (pagesCount <= 1) return;
    
    const prevItem = createPageItem(
        "Назад", 
        currentPage === 1, 
        () => {
            if (currentPage > 1) {
                currentPage--;
                updateCourses();
            }
        }
    );
    pagination.appendChild(prevItem);
    
    for (let i = 1; i <= pagesCount; i++) {
        const pageItem = createPageItem(
            i,
            i === currentPage,
            () => {
                currentPage = i;
                updateCourses();
            },
            i === currentPage
        );
        pagination.appendChild(pageItem);
    }
    
    const nextItem = createPageItem(
        "Вперед",
        currentPage === pagesCount,
        () => {
            if (currentPage < pagesCount) {
                currentPage++;
                updateCourses();
            }
        }
    );
    pagination.appendChild(nextItem);
}

function createPageItem(text, disabled, onClick, active = false) {
    const li = document.createElement("li");
    li.className = "page-item";
    
    if (disabled) li.classList.add("disabled");
    if (active) li.classList.add("active");
    
    const element = document.createElement(disabled || active ? "span" : "a");
    element.className = "page-link";
    element.textContent = text;
    
    if (!disabled && !active) {
        element.href = "#";
        element.addEventListener("click", e => {
            e.preventDefault();
            onClick();
        });
    }
    
    li.appendChild(element);
    return li;
}

function updateCourses() {
    renderCourses();
    renderPagination();
}

function applyCoursesFilter() {
    const nameInput = document.querySelector('#courses-search-name');
    const levelSelect = document.querySelector('#courses-search-level');
    
    if (!nameInput || !levelSelect) return;
    
    const searchName = nameInput.value.trim().toLowerCase();
    const level = levelSelect.value;
    
    filteredCourses = courses.filter(course => {
        const matchName = !searchName || course.name.toLowerCase().includes(searchName);
        const matchLevel = !level || course.level === level;
        return matchName && matchLevel;
    });
    
    currentPage = 1;
    updateCourses();
}

function initCoursesSearch() {
    const nameInput = document.querySelector("#courses-search-name");
    const levelSelect = document.querySelector("#courses-search-level");
    
    if (nameInput) {
        nameInput.addEventListener("input", applyCoursesFilter);
    }
    
    if (levelSelect) {
        levelSelect.addEventListener("change", applyCoursesFilter);
    }
}


function initCourseApplication() {
    const applyButton = document.getElementById('apply-button');
    const startDateSelect = document.getElementById('courseStartDate');
    const timeSelect = document.getElementById('courseTime');
    const submitButton = document.getElementById('submitCourseApplication');
    
    if (applyButton) {
        applyButton.addEventListener('click', showCourseModal);
    }
    
    if (startDateSelect) {
        startDateSelect.addEventListener('change', () => {
            loadCourseTimes();
            updateCourseEndDate();
            calculateTotalCost();
        });
    }
    
    if (timeSelect) {
        timeSelect.addEventListener('change', calculateTotalCost);
    }
    
    const costAffectingElements = [
        '#studentsCount', 
        '#supplementary', 
        '#personalized', 
        '#excursions', 
        '#assessment', 
        '#interactive'
    ];
    
    costAffectingElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('input', calculateTotalCost);
            element.addEventListener('change', calculateTotalCost);
        }
    });
    
    if (submitButton) {
        submitButton.addEventListener('click', submitCourseApplication);
    }
}

async function showCourseModal() {
    if (!selectedCourseId) {
        showNotification("Сначала выберите курс из списка", "warning");
        return;
    }
    
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;
    
    document.getElementById("courseName").value = course.name;
    document.getElementById("courseTutor").value = course.teacher;
    
    await loadCourseSchedules(selectedCourseId);
    
    document.getElementById("studentsCount").value = 1;
    
    document.getElementById("supplementary").checked = false;
    document.getElementById("personalized").checked = false;
    document.getElementById("excursions").checked = false;
    document.getElementById("assessment").checked = false;
    document.getElementById("interactive").checked = false;
    
    calculateTotalCost();
    
    new bootstrap.Modal(document.getElementById('courseApplicationModal')).show();
}

async function loadCourseSchedules(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const dateSelect = document.getElementById('courseStartDate');
    if (!dateSelect) return;
    
    dateSelect.innerHTML = '<option value="">Выберите дату</option>';
    
    const uniqueDates = [...new Set(
        course.start_dates.map(d => new Date(d).toISOString().split("T")[0])
    )].sort();
    
    uniqueDates.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = new Date(date).toLocaleDateString("ru-RU", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
        dateSelect.appendChild(option);
    });
    
    const timeSelect = document.getElementById('courseTime');
    if (timeSelect) {
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
    }
    
    updateCourseEndDate();
}

function loadCourseTimes() {
    const date = getElementValue("courseStartDate");
    const timeSelect = document.getElementById('courseTime');
    const course = courses.find(c => c.id === selectedCourseId);
    
    if (!timeSelect || !course) return;
    
    if (!date) {
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        return;
    }
    
    timeSelect.disabled = false;
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    
    course.start_dates.forEach(startDateTime => {
        const d = new Date(startDateTime);
        const slotDate = d.toISOString().split("T")[0];
        
        if (slotDate === date) {
            const start = d.toTimeString().slice(0, 5);
            const end = new Date(d.getTime() + course.week_length * 60 * 60 * 1000);
            const endStr = end.toTimeString().slice(0, 5);
            
            const option = document.createElement("option");
            option.value = start;
            option.textContent = `${start} - ${endStr}`;
            timeSelect.appendChild(option);
        }
    });
}

function updateCourseEndDate() {
    const course = courses.find(c => c.id === selectedCourseId);
    const date = getElementValue("courseStartDate");
    const durationElement = document.getElementById("courseDuration");
    
    if (!course || !date || !durationElement) return;
    
    durationElement.value = `${course.total_length} недель (до ${getEndDateFormatted(date, course.total_length)})`;
}


function calculateTotalCost() {
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return 0;
    
    const students = Number(getElementValue("studentsCount")) || 1;
    const selectedDate = getElementValue("courseStartDate");
    const selectedTime = getElementValue("courseTime");
    
    const durationHours = course.week_length * course.total_length;
    
    let weekendMultiplier = 1;
    if (selectedDate) {
        const day = new Date(selectedDate).getDay();
        if (day === 0 || day === 6) {
            weekendMultiplier = 1.5;
        }
    }
    
    let morningSurcharge = 0;
    let eveningSurcharge = 0;
    
    if (selectedTime) {
        const hour = parseInt(selectedTime.split(":")[0]);
        if (hour >= 9 && hour < 12) {
            morningSurcharge = 400;
        }
        if (hour >= 18 && hour < 20) {
            eveningSurcharge = 1000;
        }
    }
    
    let total = (course.course_fee_per_hour * durationHours * weekendMultiplier + 
                 morningSurcharge + eveningSurcharge) * students;
    
    if (getElementChecked("supplementary")) {
        total += 2000 * students;
    }
    
    if (getElementChecked("personalized")) {
        total += 1500 * course.total_length * students;
    }
    
    if (getElementChecked("assessment")) {
        total += 300 * students;
    }
    
    if (getElementChecked("excursions")) {
        total *= 1.25;
    }
    
    if (getElementChecked("interactive")) {
        total *= 1.5;
    }
    
    if (students >= 5) {
        total *= 0.85; 
    }
    
    if (course.week_length >= 5) {
        total *= 1.2; 
    }
    
    if (selectedDate) {
        const diffDays = (new Date(selectedDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 30) {
            total *= 0.9; 
        }
    }
    
    total = Math.round(total);
    const totalCostElement = document.getElementById('totalCost');
    if (totalCostElement) {
        totalCostElement.value = `${total.toLocaleString()} ₽`;
    }
    
    return total;
}


async function submitCourseApplication() {
    if (!selectedCourseId) {
        showNotification("Не выбран курс", "warning");
        return;
    }
    
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) {
        showNotification("Курс не найден", "danger");
        return;
    }
    
    const selectedDate = getElementValue("courseStartDate");
    const selectedTime = getElementValue("courseTime");
    
    if (!selectedDate || !selectedTime) {
        showNotification("Выберите дату и время начала курса", "warning");
        return;
    }
    
    const persons = Number(getElementValue("studentsCount")) || 1;
    const totalCost = calculateTotalCost();
    
    const isEarlyRegistration = selectedDate ? 
        (new Date(selectedDate) - new Date()) / (1000 * 60 * 60 * 24) >= 30 : 
        false;
    
    const payload = {
        course_id: selectedCourseId,
        date_start: selectedDate,
        time_start: selectedTime,
        duration: course.week_length * course.total_length, 
        persons: persons,
        price: totalCost,
        early_registration: isEarlyRegistration,
        group_enrollment: persons >= 5,
        intensive_course: course.week_length >= 5,
        supplementary: getElementChecked("supplementary"),
        personalized: getElementChecked("personalized"),
        excursions: getElementChecked("excursions"),
        assessment: getElementChecked("assessment"),
        interactive: getElementChecked("interactive")
    };
    
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/orders?api_key=${API_KEY}`,
            {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );
        
        
        if (response.ok) {
            showNotification("Заявка успешно отправлена!", "success");
            
            document.getElementById('courseApplicationModal')?.classList.remove('show');
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            const form = document.getElementById("courseApplicationForm");
            if (form) {
                form.reset();
            }
            selectedCourseId = null;
            renderCourses();
            
        } else {
            const errorMessage = result.error || 
                                result.message || 
                                `Ошибка ${response.status}`;
            showNotification(errorMessage, "danger");
        }
        
    } catch (error) {
        console.error("Ошибка сети:", error);
        showNotification("Ошибка сети: " + error.message, "danger");
    }
}

window.initCourses = initCourses;
window.calculateTotalCost = calculateTotalCost;