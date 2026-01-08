

let courses = [];
let filteredCourses = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;
let selectedCourseId = null;

// =============================
// ИНИЦИАЛИЗАЦИЯ
// =============================
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
    if (pagesCount === 0) return;

    pagination.appendChild(
        createPageItem("Previous", currentPage === 1, () => {
            currentPage--;
            updateCourses();
        })
    );

    for (let i = 1; i <= pagesCount; i++) {
        pagination.appendChild(
            createPageItem(
                i,
                i === currentPage,
                () => {
                    currentPage = i;
                    updateCourses();
                },
                i === currentPage
            )
        );
    }

    pagination.appendChild(
        createPageItem("Next", currentPage === pagesCount, () => {
            currentPage++;
            updateCourses();
        })
    );
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

    nameInput.addEventListener("input", applyCoursesFilter);
    levelSelect.addEventListener("change", applyCoursesFilter);
}

function initCourseApplication() {
    document.getElementById('apply-button')
        ?.addEventListener('click', showCourseModal);

    document.getElementById('courseStartDate')
        ?.addEventListener('change', () => {
            loadCourseTimes();
            updateCourseEndDate();
            calculateTotalCost();
        });

    document.getElementById('courseTime')
        ?.addEventListener('change', calculateTotalCost);

    document
        .querySelectorAll('#studentsCount, #supplementary, #personalized, #excursions, #assessment, #interactive')
        .forEach(el => el.addEventListener('input', calculateTotalCost));

    document.getElementById('submitCourseApplication')
        ?.addEventListener('click', submitCourseApplication);
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
    const firstDate = course.start_dates[0];
    document.getElementById("courseDuration").value =
        `${course.total_length} недель (до ${getEndDateFormatted(firstDate, course.total_length)})`;

    await loadCourseSchedules(selectedCourseId);

    document.getElementById("studentsCount").value = 1;
    calculateTotalCost();

    new bootstrap.Modal(document.getElementById('courseApplicationModal')).show();
}

async function loadCourseSchedules(courseId) {
    const course = courses.find(c => c.id === courseId);

    const dateSelect = document.getElementById('courseStartDate');
    dateSelect.innerHTML = '<option value="">Выберите дату</option>';

    const uniqueDates = [...new Set(
        course.start_dates.map(d => new Date(d).toISOString().split("T")[0])
    )];

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

    document.getElementById('courseTime').disabled = true;
}

function loadCourseTimes() {
    const date = document.getElementById('courseStartDate').value;
    const timeSelect = document.getElementById('courseTime');
    const course = courses.find(c => c.id === selectedCourseId);

    if (!date) {
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option>Сначала выберите дату</option>';
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

// =============================
// ДАТА ОКОНЧАНИЯ КУРСА
// =============================
function getEndDateFormatted(startDateString, weeks) {
    const endDate = new Date(startDateString);
    endDate.setDate(endDate.getDate() + weeks * 7);

    return endDate.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function updateCourseEndDate() {
    const course = courses.find(c => c.id === selectedCourseId);
    const date = document.getElementById('courseStartDate').value;

    if (!course || !date) return;

    document.getElementById("courseDuration").value =
        `${course.total_length} недель (до ${getEndDateFormatted(date, course.total_length)})`;
}

function calculateTotalCost() {
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;

    const students = Number(document.getElementById("studentsCount").value) || 1;
    const selectedDate = document.getElementById("courseStartDate").value;
    const selectedTime = document.getElementById("courseTime").value;

    const durationHours = course.week_length * course.total_length;

    let weekendMultiplier = 1;
    if (selectedDate) {
        const day = new Date(selectedDate).getDay();
        if (day === 0 || day === 6) weekendMultiplier = 1.5;
    }

    let morningSurcharge = 0;
    let eveningSurcharge = 0;

    if (selectedTime) {
        const hour = parseInt(selectedTime.split(":")[0]);
        if (hour >= 9 && hour < 12) morningSurcharge = 400;
        if (hour >= 18 && hour < 20) eveningSurcharge = 1000;
    }

    let total =
        (course.course_fee_per_hour * durationHours * weekendMultiplier +
        morningSurcharge +
        eveningSurcharge) * students;

    if (document.getElementById("supplementary").checked) total += 2000 * students;
    if (document.getElementById("personalized").checked) total += 1500 * course.total_length * students;
    if (document.getElementById("assessment").checked) total += 300 * students;
    if (document.getElementById("excursions").checked) total *= 1.25;
    if (document.getElementById("interactive").checked) total *= 1.5;

    if (students >= 5) total *= 0.85;
    if (course.week_length >= 5) total *= 1.2;

    if (selectedDate) {
        const diffDays = (new Date(selectedDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 30) total *= 0.9;
    }

    document.getElementById('totalCost').value =
        `${Math.round(total).toLocaleString()} ₽`;
}

async function submitCourseApplication() {
    if (!selectedCourseId) return;

    const payload = {
        course_id: selectedCourseId,
        tutor_id: 0,
        date_start: document.getElementById("courseStartDate").value,
        time_start: document.getElementById("courseTime").value,
        duration: courses.find(c => c.id === selectedCourseId).week_length,
        persons: Number(document.getElementById("studentsCount").value),
        supplementary: document.getElementById("supplementary").checked,
        personalized: document.getElementById("personalized").checked,
        excursions: document.getElementById("excursions").checked,
        assessment: document.getElementById("assessment").checked,
        interactive: document.getElementById("interactive").checked
    };

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/orders?api_key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        if (response.ok) {
            showNotification("Заявка успешно отправлена!", "success");
            bootstrap.Modal.getInstance(
                document.getElementById("courseApplicationModal")
            ).hide();
        } else {
            showNotification("Ошибка при отправке заявки", "danger");
        }
    } catch (err) {
        showNotification("Ошибка сети", "danger");
    }
}
