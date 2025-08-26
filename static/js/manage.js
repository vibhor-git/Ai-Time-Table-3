// Subject and Teacher Management module for AI Timetable Generator

let selectedSubjects = new Set();

// Initialize management page
document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    
    initializeManagement();
    setupEventListeners();
    loadSubjects();
});

function initializeManagement() {
    // Setup form validation
    const form = document.getElementById('subjectForm');
    if (form) {
        form.addEventListener('submit', handleSubjectSubmission);
    }
    
    // Add initial teacher input if none exists
    addInitialTeacher();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterSubjects, 300));
    }
}

function addInitialTeacher() {
    const teachersList = document.getElementById('teachersList');
    if (teachersList && teachersList.children.length === 0) {
        addTeacher();
    }
}

function addTeacher() {
    const teachersList = document.getElementById('teachersList');
    const teacherDiv = document.createElement('div');
    teacherDiv.className = 'input-group mb-2 animate-slide-up';
    teacherDiv.innerHTML = `
        <input type="text" class="form-control teacher-input" placeholder="Teacher Name" required>
        <button type="button" class="btn btn-outline-danger" onclick="removeTeacher(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    teachersList.appendChild(teacherDiv);
}

function removeTeacher(button) {
    const teacherDiv = button.closest('.input-group');
    const teachersList = teacherDiv.parentNode;
    
    // Don't allow removing the last teacher
    if (teachersList.children.length <= 1) {
        showToast('At least one teacher is required', 'warning');
        return;
    }
    
    teacherDiv.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => {
        teacherDiv.remove();
    }, 300);
}

function handleSubjectSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    if (!validateForm(form)) {
        return;
    }
    
    const formData = collectSubjectFormData();
    if (!formData) {
        return;
    }
    
    // Check for duplicates
    const existingSubjects = getSubjectsFromStorage();
    const duplicate = existingSubjects.find(s => 
        s.subjectCode.toLowerCase() === formData.subjectCode.toLowerCase() &&
        s.courseName.toLowerCase() === formData.courseName.toLowerCase() &&
        s.className.toLowerCase() === formData.className.toLowerCase()
    );
    
    if (duplicate) {
        showToast('A subject with this code already exists for this course and class', 'error');
        return;
    }
    
    // Save subject
    const newSubject = {
        id: generateId(),
        ...formData,
        createdAt: new Date().toISOString()
    };
    
    existingSubjects.push(newSubject);
    
    if (saveSubjectsToStorage(existingSubjects)) {
        showToast('Subject saved successfully!', 'success');
        resetForm(form);
        addInitialTeacher();
        loadSubjects();
        
        // Save to history as well
        saveTimetableToHistory(`Added Subject: ${formData.subjectName}`, {
            type: 'subject_added',
            subject: newSubject
        });
    } else {
        showToast('Failed to save subject. Please try again.', 'error');
    }
}

function collectSubjectFormData() {
    const courseName = document.getElementById('courseName').value.trim();
    const className = document.getElementById('className').value.trim();
    const subjectCode = document.getElementById('subjectCode').value.trim();
    const subjectName = document.getElementById('subjectName').value.trim();
    
    // Collect teachers
    const teacherInputs = document.querySelectorAll('.teacher-input');
    const teacherNames = [];
    
    for (const input of teacherInputs) {
        const teacher = input.value.trim();
        if (teacher) {
            teacherNames.push(teacher);
        }
    }
    
    if (!courseName || !className || !subjectCode || !subjectName) {
        showToast('Please fill in all required fields', 'error');
        return null;
    }
    
    if (teacherNames.length === 0) {
        showToast('Please add at least one teacher', 'error');
        return null;
    }
    
    return {
        courseName,
        className,
        subjectCode,
        subjectName,
        teacherNames
    };
}

function loadSubjects() {
    const subjects = getSubjectsFromStorage();
    const container = document.getElementById('subjectsContainer');
    
    if (!container) return;
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-book fa-3x mb-3"></i>
                <h5>No Subjects Found</h5>
                <p>Add your first subject using the form on the left.</p>
            </div>
        `;
        return;
    }
    
    // Sort subjects by course, then class, then subject name
    subjects.sort((a, b) => {
        if (a.courseName !== b.courseName) {
            return a.courseName.localeCompare(b.courseName);
        }
        if (a.className !== b.className) {
            return a.className.localeCompare(b.className);
        }
        return a.subjectName.localeCompare(b.subjectName);
    });
    
    let html = '';
    subjects.forEach((subject, index) => {
        html += generateSubjectCard(subject, index);
    });
    
    container.innerHTML = html;
}

function generateSubjectCard(subject, index) {
    const teacherBadges = subject.teacherNames.map(teacher => 
        `<span class="teacher-badge">${teacher}</span>`
    ).join(' ');
    
    const isSelected = selectedSubjects.has(subject.id);
    
    return `
        <div class="subject-item animate-slide-up ${isSelected ? 'selected' : ''}" 
             style="animation-delay: ${index * 0.05}s" data-id="${subject.id}">
            <div class="subject-header">
                <div class="d-flex align-items-center">
                    <div class="form-check me-3">
                        <input class="form-check-input" type="checkbox" 
                               ${isSelected ? 'checked' : ''} 
                               onchange="toggleSubjectSelection('${subject.id}', this.checked)">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">${subject.subjectName}</h6>
                                <span class="subject-code">${subject.subjectCode}</span>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                        type="button" data-bs-toggle="dropdown">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="editSubject('${subject.id}')">
                                        <i class="fas fa-edit me-2"></i>Edit
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" onclick="duplicateSubject('${subject.id}')">
                                        <i class="fas fa-copy me-2"></i>Duplicate
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteSubject('${subject.id}')">
                                        <i class="fas fa-trash me-2"></i>Delete
                                    </a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-2">
                <small class="text-primary">
                    <i class="fas fa-graduation-cap me-1"></i>${subject.courseName}
                </small>
                <small class="text-secondary ms-2">
                    <i class="fas fa-users me-1"></i>${subject.className}
                </small>
            </div>
            
            <div class="mt-2">
                <small class="text-muted d-block mb-1">Teachers:</small>
                ${teacherBadges}
            </div>
            
            <div class="mt-2">
                <small class="text-muted">
                    <i class="fas fa-calendar me-1"></i>Added: ${formatDateTime(subject.createdAt).date}
                </small>
            </div>
        </div>
    `;
}

function toggleSubjectSelection(subjectId, isSelected) {
    if (isSelected) {
        selectedSubjects.add(subjectId);
    } else {
        selectedSubjects.delete(subjectId);
    }
    
    // Update visual state
    const subjectItem = document.querySelector(`[data-id="${subjectId}"]`);
    if (subjectItem) {
        subjectItem.classList.toggle('selected', isSelected);
    }
}

function filterSubjects() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const subjectItems = document.querySelectorAll('.subject-item');
    
    subjectItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm);
        item.style.display = isVisible ? 'block' : 'none';
    });
}

function editSubject(subjectId) {
    const subjects = getSubjectsFromStorage();
    const subject = subjects.find(s => s.id === subjectId);
    
    if (!subject) return;
    
    // Populate edit form
    document.getElementById('editId').value = subjectId;
    document.getElementById('editCourseName').value = subject.courseName;
    document.getElementById('editClassName').value = subject.className;
    document.getElementById('editSubjectCode').value = subject.subjectCode;
    document.getElementById('editSubjectName').value = subject.subjectName;
    
    // Populate teachers
    const editTeachersList = document.getElementById('editTeachersList');
    editTeachersList.innerHTML = '';
    
    subject.teacherNames.forEach(teacher => {
        const teacherDiv = document.createElement('div');
        teacherDiv.className = 'input-group mb-2';
        teacherDiv.innerHTML = `
            <input type="text" class="form-control edit-teacher-input" value="${teacher}" required>
            <button type="button" class="btn btn-outline-danger" onclick="removeEditTeacher(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        editTeachersList.appendChild(teacherDiv);
    });
    
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

function addEditTeacher() {
    const editTeachersList = document.getElementById('editTeachersList');
    const teacherDiv = document.createElement('div');
    teacherDiv.className = 'input-group mb-2';
    teacherDiv.innerHTML = `
        <input type="text" class="form-control edit-teacher-input" placeholder="Teacher Name" required>
        <button type="button" class="btn btn-outline-danger" onclick="removeEditTeacher(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    editTeachersList.appendChild(teacherDiv);
}

function removeEditTeacher(button) {
    const teacherDiv = button.closest('.input-group');
    const teachersList = teacherDiv.parentNode;
    
    if (teachersList.children.length <= 1) {
        showToast('At least one teacher is required', 'warning');
        return;
    }
    
    teacherDiv.remove();
}

function updateSubject() {
    const form = document.getElementById('editForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const subjectId = document.getElementById('editId').value;
    const subjects = getSubjectsFromStorage();
    const subjectIndex = subjects.findIndex(s => s.id === subjectId);
    
    if (subjectIndex === -1) return;
    
    // Collect teachers
    const editTeacherInputs = document.querySelectorAll('.edit-teacher-input');
    const teacherNames = [];
    
    for (const input of editTeacherInputs) {
        const teacher = input.value.trim();
        if (teacher) {
            teacherNames.push(teacher);
        }
    }
    
    if (teacherNames.length === 0) {
        showToast('Please add at least one teacher', 'error');
        return;
    }
    
    // Update subject
    subjects[subjectIndex] = {
        ...subjects[subjectIndex],
        courseName: document.getElementById('editCourseName').value.trim(),
        className: document.getElementById('editClassName').value.trim(),
        subjectCode: document.getElementById('editSubjectCode').value.trim(),
        subjectName: document.getElementById('editSubjectName').value.trim(),
        teacherNames: teacherNames
    };
    
    if (saveSubjectsToStorage(subjects)) {
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        loadSubjects();
        showToast('Subject updated successfully!', 'success');
    } else {
        showToast('Failed to update subject', 'error');
    }
}

function duplicateSubject(subjectId) {
    const subjects = getSubjectsFromStorage();
    const original = subjects.find(s => s.id === subjectId);
    
    if (!original) return;
    
    const duplicate = {
        ...original,
        id: generateId(),
        subjectCode: original.subjectCode + '_COPY',
        subjectName: original.subjectName + ' (Copy)',
        createdAt: new Date().toISOString()
    };
    
    subjects.push(duplicate);
    
    if (saveSubjectsToStorage(subjects)) {
        loadSubjects();
        showToast('Subject duplicated successfully!', 'success');
    } else {
        showToast('Failed to duplicate subject', 'error');
    }
}

function deleteSubject(subjectId) {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    const subjects = getSubjectsFromStorage();
    const updatedSubjects = subjects.filter(s => s.id !== subjectId);
    
    if (saveSubjectsToStorage(updatedSubjects)) {
        selectedSubjects.delete(subjectId);
        loadSubjects();
        showToast('Subject deleted successfully!', 'success');
    } else {
        showToast('Failed to delete subject', 'error');
    }
}

// Bulk actions
function selectAllSubjects() {
    const checkboxes = document.querySelectorAll('.subject-item input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            cb.checked = true;
            const subjectId = cb.closest('.subject-item').dataset.id;
            selectedSubjects.add(subjectId);
            cb.closest('.subject-item').classList.add('selected');
        }
    });
}

function clearSelection() {
    const checkboxes = document.querySelectorAll('.subject-item input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest('.subject-item').classList.remove('selected');
    });
    selectedSubjects.clear();
}

function deleteSelected() {
    if (selectedSubjects.size === 0) {
        showToast('No subjects selected', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedSubjects.size} selected subject(s)?`)) return;
    
    const subjects = getSubjectsFromStorage();
    const updatedSubjects = subjects.filter(s => !selectedSubjects.has(s.id));
    
    if (saveSubjectsToStorage(updatedSubjects)) {
        selectedSubjects.clear();
        loadSubjects();
        showToast('Selected subjects deleted successfully!', 'success');
    } else {
        showToast('Failed to delete subjects', 'error');
    }
}

function duplicateSelected() {
    if (selectedSubjects.size === 0) {
        showToast('No subjects selected', 'warning');
        return;
    }
    
    const subjects = getSubjectsFromStorage();
    const newSubjects = [];
    
    selectedSubjects.forEach(subjectId => {
        const original = subjects.find(s => s.id === subjectId);
        if (original) {
            newSubjects.push({
                ...original,
                id: generateId(),
                subjectCode: original.subjectCode + '_COPY',
                subjectName: original.subjectName + ' (Copy)',
                createdAt: new Date().toISOString()
            });
        }
    });
    
    const updatedSubjects = [...subjects, ...newSubjects];
    
    if (saveSubjectsToStorage(updatedSubjects)) {
        selectedSubjects.clear();
        loadSubjects();
        showToast(`${newSubjects.length} subject(s) duplicated successfully!`, 'success');
    } else {
        showToast('Failed to duplicate subjects', 'error');
    }
}

// Export/Import functionality
function exportSubjects() {
    const subjects = getSubjectsFromStorage();
    
    if (subjects.length === 0) {
        showToast('No subjects to export', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(subjects, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `subjects_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('Subjects exported successfully!', 'success');
}

function importSubjects() {
    const modal = new bootstrap.Modal(document.getElementById('importModal'));
    modal.show();
}

function processImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a file to import', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedData)) {
                throw new Error('Invalid file format');
            }
            
            // Validate data structure
            for (const item of importedData) {
                if (!item.courseName || !item.className || !item.subjectCode || !item.subjectName) {
                    throw new Error('Missing required fields in import data');
                }
            }
            
            const existingSubjects = getSubjectsFromStorage();
            let importCount = 0;
            let skipCount = 0;
            
            importedData.forEach(item => {
                // Check for duplicates
                const exists = existingSubjects.some(existing => 
                    existing.subjectCode.toLowerCase() === item.subjectCode.toLowerCase() &&
                    existing.courseName.toLowerCase() === item.courseName.toLowerCase() &&
                    existing.className.toLowerCase() === item.className.toLowerCase()
                );
                
                if (!exists) {
                    existingSubjects.push({
                        ...item,
                        id: generateId(),
                        createdAt: new Date().toISOString()
                    });
                    importCount++;
                } else {
                    skipCount++;
                }
            });
            
            if (saveSubjectsToStorage(existingSubjects)) {
                bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
                loadSubjects();
                
                let message = `Import completed! ${importCount} subjects imported.`;
                if (skipCount > 0) {
                    message += ` ${skipCount} subjects skipped (duplicates).`;
                }
                
                showToast(message, 'success');
            } else {
                showToast('Failed to save imported subjects', 'error');
            }
            
        } catch (error) {
            console.error('Import error:', error);
            showToast('Invalid file format or corrupted data', 'error');
        }
    };
    
    reader.readAsText(file);
}

// Utility function for debouncing
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

// Export management functions
window.ManageModule = {
    addTeacher,
    removeTeacher,
    editSubject,
    updateSubject,
    deleteSubject,
    duplicateSubject,
    selectAllSubjects,
    clearSelection,
    deleteSelected,
    duplicateSelected,
    exportSubjects,
    importSubjects,
    processImport,
    addEditTeacher,
    removeEditTeacher
};
