let tutors = [];
let filteredTutors = [];
let selectedTutorId = null;

async function initTutors() {
  try {
    tutors = await getTutors();
    filteredTutors = tutors.slice();
    renderTutorsTable();
    initTutorsSearch();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

function renderTutorsTable() {
  const tbody = document.getElementById('tutors-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  filteredTutors.forEach(tutor => {
    const tr = document.createElement('tr');
    if (selectedTutorId === tutor.id) {
      tr.classList.add('table-info');
    }

    const initials = tutor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    tr.innerHTML = `
      <td>
        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" 
             style="width: 45px; height: 45px; font-size: 14px;">
          ${initials}
        </div>
      </td>
      <td>${tutor.name}</td>
      <td>${getLevelDisplay(tutor.language_level)}</td>
      <td>${tutor.languages_spoken?.map(lang => getLanguageDisplay(lang)).join(', ') || '-'}</td>
      <td>${tutor.work_experience}</td>
      <td>${tutor.price_per_hour} ₽</td>
      <td>
        <button class="btn btn-sm ${selectedTutorId === tutor.id ? 'btn-info' : 'btn-outline-primary'} select-tutor-btn" 
                data-tutor-id="${tutor.id}">
          ${selectedTutorId === tutor.id ? 'Выбран(а)' : 'Выбрать'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getLevelDisplay(level) {
  const levels = {
    'Beginner': 'Начальный',
    'Intermediate': 'Средний', 
    'Advanced': 'Продвинутый'
  };
  return levels[level] || level;
}

function getLanguageDisplay(lang) {
  const languages = {
    'English': 'Английский',
    'Russian': 'Русский',
    'Spanish': 'Испанский',
    'French': 'Французский',
    'Japanese': 'Японский',
    'German': 'Немецкий',
    'Italian': 'Итальянский'
  };
  return languages[lang] || lang;
}


function applyTutorsFilter() {
  const languagesSelect = document.querySelector('#tutors-languages');
  const levelSelect = document.querySelector('#tutors-level');

  const selectedLanguage = languagesSelect?.value || '';
  const level = levelSelect?.value || '';

  filteredTutors = tutors.filter(tutor => {
    const languagesMatch = !selectedLanguage || tutor.languages_offered?.includes(selectedLanguage);
    const levelMatch = !level || tutor.language_level === level;
    return languagesMatch && levelMatch;
  });

  renderTutorsTable();
}

function initTutorsSearch() {
  const form = document.querySelector('#tutors-search-form');
  
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyTutorsFilter();
  });

  document.querySelector('#tutors-languages')?.addEventListener('change', applyTutorsFilter);
  document.querySelector('#tutors-level')?.addEventListener('change', applyTutorsFilter);

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('select-tutor-btn')) {
      const tutorId = parseInt(e.target.dataset.tutorId);
      selectedTutorId = selectedTutorId === tutorId ? null : tutorId;
      renderTutorsTable();
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
    const contactButton = document.getElementById('contact-selected-tutor');
    const submitButton = document.getElementById('submitContactForm');
    const contactForm = document.getElementById('contactTutorForm');
    
    contactButton?.addEventListener('click', function() {
        if (!selectedTutorId) {
            showNotification('Пожалуйста, выберите репетитора сначала', 'warning');
            return;
        }
        
        const selectedTutor = tutors.find(t => t.id === selectedTutorId);
        
        if (selectedTutor) {
            const modal = new bootstrap.Modal(document.getElementById('contactTutorModal'));
            modal.show();
            
            contactForm.reset();
            contactForm.classList.remove('was-validated');
        }
    });
    
    submitButton?.addEventListener('click', function() {
        if (!contactForm.checkValidity()) {
            contactForm.classList.add('was-validated');
            return;
        }
        
        
        const selectedTutor = tutors.find(t => t.id === selectedTutorId);
        
        if (selectedTutor) {
           
            const modal = bootstrap.Modal.getInstance(document.getElementById('contactTutorModal'));
            modal.hide();
            
            showNotification(`Ваше сообщение репетитору ${selectedTutor.name} успешно отправлено!`, 'success');
            
            contactForm.reset();
            contactForm.classList.remove('was-validated');
        }
    });
    
    contactForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        submitButton.click();
    });
});


window.initTutors = initTutors;
