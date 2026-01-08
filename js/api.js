const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = '8d176988-65a4-43a5-818f-ab84a4874610';


async function apiGet(endpoint) {
  const url = `${API_BASE_URL}${endpoint}?api_key=${API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Ошибка при загрузке данных');
  }

  return response.json();
}


function getCourses() {
  return apiGet('/api/courses');
}


