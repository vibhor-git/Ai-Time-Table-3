// Timetable Generator module for AI Timetable Generator

let generatorType = 'course'; // 'course' or 'class'
let currentTimetableData = null;

// Initialize generator based on type
function initializeGenerator(type) {
    if (!requireAuth()) return;
    
    generatorType = type;
    setupGeneratorForm();
    loadSavedSubjects();
    setupBreakToggle();
    addInitialSubject();
}

function setupGeneratorForm() {
    const formId = generatorType === 'course' ? 'courseForm' : 'classForm';
    const form = document.getElementById(formId);
    
    if (form) {
        form.addEventListener('submit', handleTimetableGeneration);
    }
}

function setupBreakToggle() {
    const breakEnabled = document.getElementById('breakEnabled');
    const breakOptions = document.getElementById('breakOptions');
    
    if (breakEnabled && breakOptions) {
        breakEnabled.addEventListener('change', function() {
            breakOptions.style.display = this.checked ? 'block' : 'none';
        });
        
        // Initial state
        breakOptions.style.display = breakEnabled.checked ? 'block' : 'none';
    }
}

function addSubject() {
    const container = document.getElementById('subjectsList');
    const subjectCount = container.children.length;
    
    const subjectDiv = document.createElement('div');
    subjectDiv.className = 'subject-item mb-3 p-3 border rounded animate-slide-up';
    subjectDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Subject ${subjectCount + 1}</h6>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeSubject(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="row g-2">
            <div class="col-md-6">
                <label class="form-label">Subject Code</label>
                <input type="text" class="form-control subject-code" placeholder="e.g., CS101" required>
            </div>
            <div class="col-md-6">
                <label class="form-label">Subject Name</label>
                <input type="text" class="form-control subject-name" placeholder="e.g., Data Structures" required>
            </div>
        </div>
        
        <div class="mt-2">
            <label class="form-label">Teachers</label>
            <div class="teachers-list">
                <div class="input-group mb-2">
                    <input type="text" class="form-control teacher-input" placeholder="Teacher Name" required>
                    <button type="button" class="btn btn-outline-danger" onclick="removeTeacher(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <button type="button" class="btn btn-outline-primary btn-sm" onclick="addTeacherToSubject(this)">
                <i class="fas fa-plus me-1"></i>Add Teacher
            </button>
        </div>
        
        <div class="row g-2 mt-2">
            <div class="col-md-12">
                <label class="form-label">Priority</label>
                <select class="form-select subject-priority">
                    <option value="normal" selected>Normal</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                </select>
                <div class="form-text">Lectures per week will be automatically calculated based on working days and lectures per day</div>
            </div>
        </div>
        
        <div class="mt-3">
            <div class="form-check form-switch">
                <input class="form-check-input lab-checkbox" type="checkbox" onchange="toggleLabOptions(this)">
                <label class="form-check-label">Lab Subject</label>
            </div>
            
            <div class="lab-options mt-2" style="display: none;">
                <label class="form-label">Lab Duration</label>
                <select class="form-select lab-duration">
                    <option value="regular" selected>Regular Duration (same as lecture)</option>
                    <option value="double">Lab Duration (2 consecutive periods)</option>
                </select>
                <div class="form-text">Lab duration will automatically block 2 consecutive periods in timetable</div>
            </div>
        </div>
    `;
    
    container.appendChild(subjectDiv);
}

function addInitialSubject() {
    const container = document.getElementById('subjectsList');
    if (container && container.children.length === 0) {
        addSubject();
    }
}

function removeSubject(button) {
    const subjectDiv = button.closest('.subject-item');
    subjectDiv.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => {
        subjectDiv.remove();
        updateSubjectNumbers();
    }, 300);
}

function updateSubjectNumbers() {
    const subjects = document.querySelectorAll('.subject-item h6');
    subjects.forEach((header, index) => {
        header.textContent = `Subject ${index + 1}`;
    });
}

function addTeacherToSubject(button) {
    const teachersList = button.previousElementSibling;
    const newTeacher = document.createElement('div');
    newTeacher.className = 'input-group mb-2';
    newTeacher.innerHTML = `
        <input type="text" class="form-control teacher-input" placeholder="Teacher Name" required>
        <button type="button" class="btn btn-outline-danger" onclick="removeTeacher(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    teachersList.appendChild(newTeacher);
}

function removeTeacher(button) {
    const teacherDiv = button.closest('.input-group');
    const teachersList = teacherDiv.parentNode;
    
    // Don't allow removing the last teacher
    if (teachersList.children.length <= 1) {
        showToast('At least one teacher is required for each subject', 'warning');
        return;
    }
    
    teacherDiv.remove();
}

function toggleLabOptions(checkbox) {
    const labOptions = checkbox.closest('.subject-item').querySelector('.lab-options');
    labOptions.style.display = checkbox.checked ? 'block' : 'none';
}

function loadSavedSubjects() {
    const subjects = getSubjectsFromStorage();
    if (subjects.length === 0) return;
    
    // Group subjects by course and class for easy selection
    const groupedSubjects = {};
    subjects.forEach(subject => {
        const key = `${subject.courseName} - ${subject.className}`;
        if (!groupedSubjects[key]) {
            groupedSubjects[key] = [];
        }
        groupedSubjects[key].push(subject);
    });
    
    // Add a "Load Saved Subjects" button if there are saved subjects
    const container = document.getElementById('subjectsList');
    if (container) {
        const loadButton = document.createElement('div');
        loadButton.className = 'mb-3';
        loadButton.innerHTML = `
            <button type="button" class="btn btn-outline-info w-100" onclick="showLoadSubjectsModal()">
                <i class="fas fa-download me-2"></i>Load Saved Subjects
            </button>
        `;
        container.parentNode.insertBefore(loadButton, container);
    }
}

function showLoadSubjectsModal() {
    const subjects = getSubjectsFromStorage();
    if (subjects.length === 0) {
        showToast('No saved subjects found', 'info');
        return;
    }
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-download me-2"></i>Load Saved Subjects
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <input type="text" class="form-control" id="subjectSearchInput" 
                               placeholder="Search subjects..." onkeyup="filterLoadableSubjects()">
                    </div>
                    <div id="loadableSubjectsList" class="max-height-400 overflow-auto">
                        ${generateLoadableSubjectsList(subjects)}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="loadSelectedSubjects()">
                        <i class="fas fa-check me-2"></i>Load Selected
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remove modal from DOM when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

function generateLoadableSubjectsList(subjects) {
    let html = '';
    subjects.forEach(subject => {
        html += `
            <div class="card mb-2 loadable-subject">
                <div class="card-body p-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${subject.id}" id="load_${subject.id}">
                        <label class="form-check-label w-100" for="load_${subject.id}">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">${subject.subjectName}</h6>
                                    <small class="text-muted">${subject.subjectCode}</small>
                                    <br>
                                    <small class="text-primary">${subject.courseName} - ${subject.className}</small>
                                </div>
                                <div class="text-end">
                                    <small class="text-muted">Teachers: ${subject.teacherNames?.length || 0}</small>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        `;
    });
    return html;
}

function filterLoadableSubjects() {
    const searchTerm = document.getElementById('subjectSearchInput').value.toLowerCase();
    const subjects = document.querySelectorAll('.loadable-subject');
    
    subjects.forEach(subject => {
        const text = subject.textContent.toLowerCase();
        subject.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

function loadSelectedSubjects() {
    const checkboxes = document.querySelectorAll('#loadableSubjectsList input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        showToast('Please select at least one subject', 'warning');
        return;
    }
    
    const subjects = getSubjectsFromStorage();
    const container = document.getElementById('subjectsList');
    
    // Clear existing subjects
    container.innerHTML = '';
    
    checkboxes.forEach(checkbox => {
        const subjectId = checkbox.value;
        const subject = subjects.find(s => s.id === subjectId);
        
        if (subject) {
            addSubjectFromData(subject);
        }
    });
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
    modal.hide();
    
    showToast(`${checkboxes.length} subject(s) loaded successfully!`, 'success');
}

function addSubjectFromData(subjectData) {
    const container = document.getElementById('subjectsList');
    const subjectCount = container.children.length;
    
    const subjectDiv = document.createElement('div');
    subjectDiv.className = 'subject-item mb-3 p-3 border rounded animate-slide-up';
    
    let teachersHtml = '';
    (subjectData.teacherNames || []).forEach(teacher => {
        teachersHtml += `
            <div class="input-group mb-2">
                <input type="text" class="form-control teacher-input" value="${teacher}" required>
                <button type="button" class="btn btn-outline-danger" onclick="removeTeacher(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    if (!teachersHtml) {
        teachersHtml = `
            <div class="input-group mb-2">
                <input type="text" class="form-control teacher-input" placeholder="Teacher Name" required>
                <button type="button" class="btn btn-outline-danger" onclick="removeTeacher(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    subjectDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Subject ${subjectCount + 1}</h6>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeSubject(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="row g-2">
            <div class="col-md-6">
                <label class="form-label">Subject Code</label>
                <input type="text" class="form-control subject-code" value="${subjectData.subjectCode || ''}" required>
            </div>
            <div class="col-md-6">
                <label class="form-label">Subject Name</label>
                <input type="text" class="form-control subject-name" value="${subjectData.subjectName || ''}" required>
            </div>
        </div>
        
        <div class="mt-2">
            <label class="form-label">Teachers</label>
            <div class="teachers-list">
                ${teachersHtml}
            </div>
            <button type="button" class="btn btn-outline-primary btn-sm" onclick="addTeacherToSubject(this)">
                <i class="fas fa-plus me-1"></i>Add Teacher
            </button>
        </div>
        
        <div class="row g-2 mt-2">
            <div class="col-md-12">
                <label class="form-label">Priority</label>
                <select class="form-select subject-priority">
                    <option value="normal" selected>Normal</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                </select>
                <div class="form-text">Lectures per week will be automatically calculated based on working days and lectures per day</div>
            </div>
        </div>
        
        <div class="mt-3">
            <div class="form-check form-switch">
                <input class="form-check-input lab-checkbox" type="checkbox" onchange="toggleLabOptions(this)">
                <label class="form-check-label">Lab Subject</label>
            </div>
            
            <div class="lab-options mt-2" style="display: none;">
                <label class="form-label">Lab Duration</label>
                <select class="form-select lab-duration">
                    <option value="regular" selected>Regular Duration (same as lecture)</option>
                    <option value="double">Lab Duration (2 consecutive periods)</option>
                </select>
                <div class="form-text">Lab duration will automatically block 2 consecutive periods in timetable</div>
            </div>
        </div>
    `;
    
    container.appendChild(subjectDiv);
}

function handleTimetableGeneration(event) {
    event.preventDefault();
    
    const form = event.target;
    if (!validateForm(form)) {
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    setLoadingState(submitButton, true);
    
    try {
        const formData = collectFormData();
        if (!formData) {
            setLoadingState(submitButton, false);
            return;
        }
        
        if (formData.numberOfSections && formData.numberOfSections > 1) {
            // Generate timetables for multiple sections
            const sectionTimetables = generateMultipleSectionTimetables(formData);
            if (sectionTimetables) {
                displayMultipleSectionTimetables(sectionTimetables);
                saveTimetableToHistory(`${formData.courseName} - ${formData.className} (${formData.numberOfSections} sections)`, sectionTimetables);
                showToast(`Timetables generated successfully for ${formData.numberOfSections} sections!`, 'success');
            } else {
                showToast('Failed to generate timetables for all sections. Please check your constraints.', 'error');
            }
        } else {
            // Generate single timetable
            const timetable = generateTimetable(formData);
            if (timetable) {
                displayTimetable(timetable);
                saveTimetableToHistory(`${formData.courseName} - ${formData.className}`, timetable);
                showToast('Timetable generated successfully!', 'success');
            } else {
                showToast('Failed to generate timetable. Please check your constraints.', 'error');
            }
        }
    } catch (error) {
        console.error('Timetable generation error:', error);
        showToast('An error occurred while generating the timetable.', 'error');
    } finally {
        setLoadingState(submitButton, false);
    }
}

function collectFormData() {
    const courseName = document.getElementById('courseName').value.trim();
    const className = document.getElementById('className').value.trim();
    const sectionName = document.getElementById('sectionName')?.value.trim() || '';
    const numberOfSections = parseInt(document.getElementById('numberOfSections')?.value || 1);
    const workingDays = parseInt(document.getElementById('workingDays').value);
    const maxHoursPerDay = parseInt(document.getElementById('maxHoursPerDay').value);
    const freeLectures = parseInt(document.getElementById('freeLectures').value);
    const breakEnabled = document.getElementById('breakEnabled').checked;
    const breakStart = breakEnabled ? parseInt(document.getElementById('breakStart').value) : null;
    const breakDurationMinutes = breakEnabled ? parseInt(document.getElementById('breakDuration').value) : null;
    const startTime = document.getElementById('startTime').value;
    const lectureDuration = parseInt(document.getElementById('lectureDuration').value);
    
    // Collect subjects
    const subjects = [];
    const subjectItems = document.querySelectorAll('.subject-item');
    
    if (subjectItems.length === 0) {
        showToast('Please add at least one subject', 'error');
        return null;
    }
    
    for (const item of subjectItems) {
        const subjectCode = item.querySelector('.subject-code').value.trim();
        const subjectName = item.querySelector('.subject-name').value.trim();
        // Remove this line - lectures per week will be calculated automatically
        const priority = item.querySelector('.subject-priority').value;
        const isLab = item.querySelector('.lab-checkbox').checked;
        const labDuration = isLab ? item.querySelector('.lab-duration').value : 'regular';
        
        const teacherInputs = item.querySelectorAll('.teacher-input');
        const teachers = [];
        
        for (const input of teacherInputs) {
            const teacher = input.value.trim();
            if (teacher) {
                teachers.push(teacher);
            }
        }
        
        if (!subjectCode || !subjectName || teachers.length === 0) {
            showToast('Please fill in all subject details including at least one teacher', 'error');
            return null;
        }
        
        subjects.push({
            code: subjectCode,
            name: subjectName,
            teachers: teachers,
            priority: priority,
            isLab: isLab,
            labDuration: labDuration
        });
    }
    
    return {
        courseName,
        className: sectionName ? `${className} - ${sectionName}` : className,
        numberOfSections,
        workingDays,
        maxHoursPerDay,
        freeLectures,
        breakEnabled,
        breakStart: breakStart - 1, // Convert to 0-based index  
        breakDurationMinutes,
        startTime,
        lectureDuration,
        subjects
    };
}

function generateTimetable(data) {
    const startTime = Date.now();
    const TIMEOUT_MS = 10000; // 10 second timeout for single timetable
    
    try {
        const { workingDays, maxHoursPerDay, subjects, breakEnabled, breakStart, breakDurationMinutes } = data;
        
        // For single sections, use simple algorithm to avoid complexity
        if (!data.numberOfSections || data.numberOfSections === 1) {
            return generateSimpleTimetable(data);
        }
        
        // Initialize timetable grid - STRICTLY respect maxHoursPerDay
        const grid = [];
        for (let period = 0; period < maxHoursPerDay; period++) {
            const row = [];
            for (let day = 0; day < workingDays; day++) {
                row.push({ subject: null, teacher: null, subjectCode: null, isBreak: false });
            }
            grid.push(row);
        }
        
        // Create allocation plan
        const allocationPlan = createAllocationPlan(subjects, data);
        
        // Allocate subjects to timetable with timeout protection
        const success = allocateSubjectsWithTimeout(grid, allocationPlan, data, startTime, TIMEOUT_MS);
        
        if (!success) {
            console.warn('Some subjects could not be allocated due to timetable constraints, using simple allocation');
            return generateSimpleTimetable(data);
        }
        
        return {
            ...data,
            timetableGrid: grid,
            breakEnabled,
            breakStart,
            breakDurationMinutes
        };
    } catch (error) {
        console.error('Error in generateTimetable:', error);
        return generateSimpleTimetable(data);
    }
}

function createAllocationPlan(subjects, data) {
    const { workingDays, maxHoursPerDay } = data;
    
    // Calculate total lectures per week (breaks don't reduce lecture count)
    const totalLecturesPerWeek = workingDays * maxHoursPerDay;
    
    // Calculate base lectures per subject = total lectures / number of subjects
    const baseLecturesPerSubject = Math.floor(totalLecturesPerWeek / subjects.length);
    
    // Count high priority subjects
    const highPrioritySubjects = subjects.filter(subject => subject.priority === 'high');
    const normalPrioritySubjects = subjects.filter(subject => subject.priority === 'normal' || subject.priority === 'low');
    
    // Calculate remaining lectures after base allocation
    const baseTotalUsed = baseLecturesPerSubject * subjects.length;
    const remainingLectures = totalLecturesPerWeek - baseTotalUsed;
    
    // Assign base lectures to all subjects first
    subjects.forEach(subject => {
        subject.lecturesPerWeek = baseLecturesPerSubject;
    });
    
    // Note: Priority allocation now happens after grid creation, filling actual empty slots
    
    // Log the final allocation before scaling
    console.log('Lectures per subject (base allocation):');
    subjects.forEach(subject => {
        console.log(`${subject.name} (${subject.priority}): ${subject.lecturesPerWeek} lectures`);
    });
    
    // Calculate total lectures requested
    let totalLecturesRequested = 0;
    subjects.forEach(subject => {
        if (subject.isLab && subject.labDuration === 'double') {
            // Double duration labs take 2 slots
            totalLecturesRequested += subject.lecturesPerWeek * 2;
        } else {
            totalLecturesRequested += subject.lecturesPerWeek;
        }
    });
    
    console.log(`Total lectures available: ${totalLecturesPerWeek}, Total lectures requested: ${totalLecturesRequested}`);
    
    // If too many lectures requested, proportionally reduce them
    let scaleFactor = 1;
    if (totalLecturesRequested > totalLecturesPerWeek) {
        scaleFactor = totalLecturesPerWeek / totalLecturesRequested;
        console.warn(`Too many lectures requested. Scaling down by factor: ${scaleFactor.toFixed(2)}`);
    }
    
    const plan = [];
    
    subjects.forEach(subject => {
        // Apply scaling factor to lectures per week
        let adjustedLectures = Math.floor(subject.lecturesPerWeek * scaleFactor);
        
        // Ensure at least 1 lecture for high priority subjects
        if (adjustedLectures === 0 && subject.priority === 'high') {
            adjustedLectures = 1;
        }
        
        if (adjustedLectures > 0) {
            // Distribute lectures among teachers
            const teachersCount = subject.teachers.length;
            const lecturesPerTeacher = Math.floor(adjustedLectures / teachersCount);
            const extraLectures = adjustedLectures % teachersCount;
            
            subject.teachers.forEach((teacher, index) => {
                const lectures = lecturesPerTeacher + (index < extraLectures ? 1 : 0);
                
                for (let l = 0; l < lectures; l++) {
                    plan.push({
                        subject: subject.name,
                        subjectCode: subject.code,
                        teacher: teacher,
                        priority: subject.priority,
                        isLab: subject.isLab,
                        labDuration: subject.labDuration,
                        allocated: false
                    });
                }
            });
        }
    });
    
    // Sort by priority, with lab subjects requiring double duration first
    plan.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        
        // Lab subjects with double duration get highest priority
        if (a.isLab && a.labDuration === 'double' && (!b.isLab || b.labDuration !== 'double')) {
            return -1;
        }
        if (b.isLab && b.labDuration === 'double' && (!a.isLab || a.labDuration !== 'double')) {
            return 1;
        }
        
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    console.log(`Final allocation plan: ${plan.length} lectures to allocate`);
    return plan;
}

// Enhanced function to generate timetables for multiple sections with teacher conflict prevention
function generateMultipleSectionTimetables(data) {
    const startTime = Date.now();
    const TIMEOUT_MS = 30000; // 30 second timeout to prevent infinite loops
    
    try {
        // RESET global teacher schedule for new generation
        window.GLOBAL_TEACHER_SCHEDULE = {};
        
        const sections = [];
        
        console.log(`\\n=== GENERATING CONFLICT-FREE TIMETABLES FOR ${data.numberOfSections} SECTIONS ===`);
        console.log('Teacher conflict prevention: ENABLED');
        console.log('Lab duration handling: ENABLED');
        console.log('Consecutive theory prevention: ENABLED');
        
        // Generate each section with conflict-free teacher allocation
        for (let sectionNum = 1; sectionNum <= data.numberOfSections; sectionNum++) {
            // Check timeout
            if (Date.now() - startTime > TIMEOUT_MS) {
                console.error('Timetable generation timeout - stopping to prevent infinite loop');
                return null;
            }
            
            // Distribute teachers across sections to prevent conflicts
            const adjustedSubjects = distributeTeachersSimple(data.subjects, sectionNum, data.numberOfSections);
            
            const sectionData = {
                ...data,
                className: `${data.className} - Section ${sectionNum}`,
                sectionNumber: sectionNum,
                subjects: adjustedSubjects
            };
            
            console.log(`Generating Section ${sectionNum} with conflict-free teacher allocation...`);
            const sectionTimetable = generateConflictFreeTimetable(sectionData);
            if (!sectionTimetable) {
                console.error(`Failed to generate timetable for section ${sectionNum}`);
                return null;
            }
            
            sections.push(sectionTimetable);
        }
        
        return {
            ...data,
            sections: sections,
            numberOfSections: data.numberOfSections
        };
    } catch (error) {
        console.error('Error in generateMultipleSectionTimetables:', error);
        return null;
    }
}

// Simple round-robin teacher distribution to prevent complexity
function distributeTeachersSimple(subjects, sectionNumber, totalSections) {
    console.log(`Distributing teachers for Section ${sectionNumber}:`);
    
    return subjects.map(subject => {
        if (subject.teachers.length === 1) {
            console.log(`  ${subject.name}: ${subject.teachers[0]} (single teacher for all sections)`);
            return subject; // Single teacher handles all sections
        }
        
        // Round-robin assignment
        const teacherIndex = (sectionNumber - 1) % subject.teachers.length;
        const assignedTeacher = subject.teachers[teacherIndex];
        
        console.log(`  ${subject.name}: Assigned ${assignedTeacher} (teacher ${teacherIndex + 1} of ${subject.teachers.length})`);
        
        return {
            ...subject,
            teachers: [assignedTeacher]
        };
    });
}

// Simplified timetable generation to prevent infinite loops
function generateSimpleTimetable(data) {
    console.log('\n=== USING SIMPLE TIMETABLE GENERATION ===');
    return generateConflictFreeTimetable(data);
}

// NEW ADVANCED TIMETABLE GENERATOR WITH PROPER FREE LECTURE HANDLING
function generateConflictFreeTimetable(data) {
    const { workingDays, maxHoursPerDay, subjects } = data;
    
    // Initialize grid
    const grid = [];
    for (let period = 0; period < maxHoursPerDay; period++) {
        const row = [];
        for (let day = 0; day < workingDays; day++) {
            row.push({ subject: null, teacher: null, subjectCode: null, isBreak: false });
        }
        grid.push(row);
    }
    
    // STEP 1: Handle Free Lectures Logic
    const freeLectures = parseInt(data.freeLectures) || 0;
    let totalBreakPeriods = 0;
    if (data.breakEnabled) {
        totalBreakPeriods = workingDays; // One break per day
    }
    
    console.log(`\n=== ADVANCED TIMETABLE GENERATION FOR SECTION ${data.sectionNumber || 1} ===`);
    console.log(`Working days: ${workingDays}, Max hours per day: ${maxHoursPerDay}`);
    console.log(`Free lectures requested: ${freeLectures}`);
    console.log(`Break periods: ${totalBreakPeriods}`);
    console.log(`Number of subjects: ${subjects.length}`);
    
    // Implement the new free lecture logic
    if (freeLectures === 0) {
        console.log('FREE LECTURES = 0: All periods will be filled with subjects');
        return generateFullSchedule(grid, data, subjects, workingDays, maxHoursPerDay, totalBreakPeriods);
    } else {
        console.log(`FREE LECTURES = ${freeLectures}: Will have ${freeLectures} completely free days`);
        return generateScheduleWithFreeDays(grid, data, subjects, workingDays, maxHoursPerDay, totalBreakPeriods, freeLectures);
    }
        const plan = window.MASTER_ALLOCATION_PLAN[subject.name];
        const teacher = subject.teachers[0];
        
    const highPrioritySubjects = subjects.filter(s => s.priority === 'High');
    
    console.log(`Subjects breakdown: Labs=${labSubjects.length}, Theory=${theorySubjects.length}, High Priority=${highPrioritySubjects.length}`);
    
    // Create allocation plan with proper lab handling
    const allocationPlan = createAdvancedAllocationPlan(subjects, totalSlots, data);
    
    // Add breaks to grid first
    addBreaksToGrid(grid, data, workingDays, maxHoursPerDay);
    
    // Distribute subjects with teacher conflict prevention and proper lab spacing
    distributeSubjectsAdvanced(grid, allocationPlan, data, workingDays, maxHoursPerDay);
    
    return {
        ...data,
        timetableGrid: grid
    };
}

// FUNCTION: Generate schedule with specific number of free days
function generateScheduleWithFreeDays(grid, data, subjects, workingDays, maxHoursPerDay, totalBreakPeriods, freeLectures) {
    console.log(`\n=== GENERATING SCHEDULE WITH ${freeLectures} FREE DAYS ===`);
    
    // Randomly select which days will be completely free
    const freeDays = [];
    const availableDays = Array.from({length: workingDays}, (_, i) => i);
    
    for (let i = 0; i < Math.min(freeLectures, workingDays); i++) {
        const randomIndex = Math.floor(Math.random() * availableDays.length);
        freeDays.push(availableDays.splice(randomIndex, 1)[0]);
    }
    
    console.log(`Free days selected: ${freeDays.map(d => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][d]).join(', ')}`);
    
    // Mark free days in grid
    freeDays.forEach(day => {
        for (let period = 0; period < maxHoursPerDay; period++) {
            if (!data.breakEnabled || period !== data.breakStart) {
                grid[period][day] = {
                    subject: 'Free',
                    teacher: '',
                    subjectCode: '',
                    isBreak: false
                };
            }
        }
    });
    
    // Calculate available slots for subjects (excluding free days)
    const workingDaysCount = workingDays - freeDays.length;
    const totalSlots = workingDaysCount * maxHoursPerDay - (data.breakEnabled ? workingDaysCount : 0);
    
    // Create allocation plan for remaining days with proper lab handling
    const allocationPlan = createAdvancedAllocationPlan(subjects, totalSlots, data);
    
    // Add breaks to grid
    addBreaksToGrid(grid, data, workingDays, maxHoursPerDay);
    
    // Distribute subjects only on working days with teacher conflict prevention
    distributeSubjectsOnWorkingDaysAdvanced(grid, allocationPlan, data, workingDays, maxHoursPerDay, freeDays);
    
    return {
        ...data,
        timetableGrid: grid
    };
}


// Add breaks to the grid
function addBreaksToGrid(grid, data, workingDays, maxHoursPerDay) {
    if (data.breakEnabled && data.breakStart >= 0) {
        for (let day = 0; day < workingDays; day++) {
            grid[data.breakStart][day] = {
                subject: 'BREAK',
                teacher: '',
                subjectCode: '',
                isBreak: true
            };
        }
    }
}

// FUNCTION: Create advanced allocation plan with proper lab handling
function createAdvancedAllocationPlan(subjects, totalSlots, data) {
    console.log('\n=== CREATING ADVANCED ALLOCATION PLAN ===');
    
    const allocationPlan = [];
    let totalPeriodsAllocated = 0;
    
    // Calculate base periods per subject
    const basePeriodsPerSubject = Math.floor(totalSlots / subjects.length);
    const extraPeriods = totalSlots % subjects.length;
    
    console.log(`Total slots: ${totalSlots}, Base periods per subject: ${basePeriodsPerSubject}, Extra periods: ${extraPeriods}`);
    
    subjects.forEach((subject, index) => {
        let periodsForSubject = basePeriodsPerSubject;
        
        // Give extra periods to high priority subjects first
        if (subject.priority === 'High' && index < extraPeriods) {
            periodsForSubject++;
        }
        
        // Handle lab subjects with double duration
        if (subject.isLab && subject.labDuration === 'double') {
            // For double labs, each session takes 2 consecutive periods
            const labSessions = Math.floor(periodsForSubject / 2);
            console.log(`${subject.name} (${subject.priority} Lab): ${labSessions} double-lab sessions (${labSessions * 2} periods)`);
            
            for (let i = 0; i < labSessions; i++) {
                allocationPlan.push({
                    subject: subject.name,
                    subjectCode: subject.code,
                    teacher: subject.teachers[i % subject.teachers.length],
                    priority: subject.priority,
                    isLab: true,
                    isDoubleLab: true,
                    labDuration: 'double',
                    sessionId: `${subject.name}_lab_${i}`
                });
                totalPeriodsAllocated += 2;
            }
        } else {
            // Regular subjects or single-period labs
            console.log(`${subject.name} (${subject.priority}${subject.isLab ? ' Lab' : ''}): ${periodsForSubject} periods`);
            
            for (let i = 0; i < periodsForSubject; i++) {
                allocationPlan.push({
                    subject: subject.name,
                    subjectCode: subject.code,
                    teacher: subject.teachers[i % subject.teachers.length],
                    priority: subject.priority,
                    isLab: subject.isLab || false,
                    isDoubleLab: false,
                    labDuration: subject.labDuration || 'regular',
                    sessionId: `${subject.name}_${i}`
                });
                totalPeriodsAllocated++;
            }
        }
    });
    
    console.log(`Total periods allocated: ${totalPeriodsAllocated}`);
    return allocationPlan;
}

// FUNCTION: Advanced subject distribution with teacher conflict prevention
function distributeSubjectsAdvanced(grid, allocationPlan, data, workingDays, maxHoursPerDay) {
    console.log('\n=== DISTRIBUTING SUBJECTS WITH CONFLICT PREVENTION ===');
    
    // Initialize global teacher schedule if not exists (for multi-section)
    if (!window.GLOBAL_TEACHER_SCHEDULE) {
        window.GLOBAL_TEACHER_SCHEDULE = {};
    }
    
    // Sort allocation plan: Labs first (especially double labs), then by priority
    allocationPlan.sort((a, b) => {
        if (a.isDoubleLab && !b.isDoubleLab) return -1;
        if (!a.isDoubleLab && b.isDoubleLab) return 1;
        if (a.isLab && !b.isLab) return -1;
        if (!a.isLab && b.isLab) return 1;
        
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    for (const allocation of allocationPlan) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = workingDays * maxHoursPerDay * 2;
        
        while (!placed && attempts < maxAttempts) {
            for (let day = 0; day < workingDays && !placed; day++) {
                for (let period = 0; period < maxHoursPerDay && !placed; period++) {
                    if (attempts > maxAttempts) break;
                    
                    // Skip break periods
                    if (data.breakEnabled && period === data.breakStart) {
                        continue;
                    }
                    
                    if (allocation.isDoubleLab) {
                        // Handle double lab allocation (2 consecutive periods)
                        if (period < maxHoursPerDay - 1 && 
                            canPlaceDoubleLab(grid, day, period, allocation, data, workingDays, maxHoursPerDay)) {
                            
                            // Place double lab
                            grid[period][day] = {
                                subject: allocation.subject,
                                subjectCode: allocation.subjectCode,
                                teacher: allocation.teacher,
                                isBreak: false,
                                isLab: true,
                                labPart: 1,
                                labDuration: 'double'
                            };
                            
                            grid[period + 1][day] = {
                                subject: allocation.subject,
                                subjectCode: allocation.subjectCode,
                                teacher: allocation.teacher,
                                isBreak: false,
                                isLab: true,
                                labPart: 2,
                                labDuration: 'double'
                            };
                            
                            // Mark teacher as busy for both periods
                            const teacherKey1 = `${allocation.teacher}_${day}_${period}`;
                            const teacherKey2 = `${allocation.teacher}_${day}_${period + 1}`;
                            window.GLOBAL_TEACHER_SCHEDULE[teacherKey1] = true;
                            window.GLOBAL_TEACHER_SCHEDULE[teacherKey2] = true;
                            
                            console.log(`Placed double lab: ${allocation.subject} on day ${day + 1}, periods ${period + 1}-${period + 2}`);
                            placed = true;
                        }
                    } else {
                        // Handle single period allocation
                        if (canPlaceSinglePeriod(grid, day, period, allocation, data)) {
                            grid[period][day] = {
                                subject: allocation.subject,
                                subjectCode: allocation.subjectCode,
                                teacher: allocation.teacher,
                                isBreak: false,
                                isLab: allocation.isLab
                            };
                            
                            // Mark teacher as busy
                            const teacherKey = `${allocation.teacher}_${day}_${period}`;
                            window.GLOBAL_TEACHER_SCHEDULE[teacherKey] = true;
                            
                            placed = true;
                        }
                    }
                    
                    attempts++;
                }
            }
        }
        
        if (!placed) {
            console.warn(`Could not place: ${allocation.subject} (${allocation.isDoubleLab ? 'Double Lab' : 'Single'})`);
        }
    }
}

// FUNCTION: Check if double lab can be placed
function canPlaceDoubleLab(grid, day, period, allocation, data, workingDays, maxHoursPerDay) {
    // Check if both periods are empty
    if (grid[period][day].subject || grid[period + 1][day].subject) {
        return false;
    }
    
    // Check if next period is a break (labs should be consecutive without breaks)
    if (data.breakEnabled && (period + 1 === data.breakStart)) {
        return false;
    }
    
    // Check teacher availability for both periods
    const teacherKey1 = `${allocation.teacher}_${day}_${period}`;
    const teacherKey2 = `${allocation.teacher}_${day}_${period + 1}`;
    
    if (window.GLOBAL_TEACHER_SCHEDULE[teacherKey1] || window.GLOBAL_TEACHER_SCHEDULE[teacherKey2]) {
        return false;
    }
    
    return true;
}

// FUNCTION: Check if single period can be placed
function canPlaceSinglePeriod(grid, day, period, allocation, data) {
    // Check if period is empty
    if (grid[period][day].subject) {
        return false;
    }
    
    // Check teacher availability
    const teacherKey = `${allocation.teacher}_${day}_${period}`;
    if (window.GLOBAL_TEACHER_SCHEDULE[teacherKey]) {
        return false;
    }
    
    // Avoid consecutive same theory subjects
    if (!allocation.isLab) {
        // Check previous period
        if (period > 0 && grid[period - 1][day].subject === allocation.subject && !grid[period - 1][day].isLab) {
            return false;
        }
        
        // Check next period
        if (period < grid.length - 1 && grid[period + 1][day].subject === allocation.subject && !grid[period + 1][day].isLab) {
            return false;
        }
    }
    
    return true;
}

// FUNCTION: Advanced distribution for working days only (with free days)
function distributeSubjectsOnWorkingDaysAdvanced(grid, allocationPlan, data, workingDays, maxHoursPerDay, freeDays) {
    console.log('\n=== DISTRIBUTING SUBJECTS ON WORKING DAYS (WITH FREE DAYS) ===');
    
    // Initialize teacher schedule
    if (!window.GLOBAL_TEACHER_SCHEDULE) {
        window.GLOBAL_TEACHER_SCHEDULE = {};
    }
    
    // Sort allocation plan
    allocationPlan.sort((a, b) => {
        if (a.isDoubleLab && !b.isDoubleLab) return -1;
        if (!a.isDoubleLab && b.isDoubleLab) return 1;
        if (a.isLab && !b.isLab) return -1;
        if (!a.isLab && b.isLab) return 1;
        
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    for (const allocation of allocationPlan) {
        let placed = false;
        
        for (let day = 0; day < workingDays && !placed; day++) {
            // Skip free days
            if (freeDays.includes(day)) continue;
            
            for (let period = 0; period < maxHoursPerDay && !placed; period++) {
                // Skip break periods
                if (data.breakEnabled && period === data.breakStart) {
                    continue;
                }
                
                if (allocation.isDoubleLab) {
                    if (period < maxHoursPerDay - 1 && 
                        canPlaceDoubleLab(grid, day, period, allocation, data, workingDays, maxHoursPerDay)) {
                        
                        // Place double lab
                        grid[period][day] = {
                            subject: allocation.subject,
                            subjectCode: allocation.subjectCode,
                            teacher: allocation.teacher,
                            isBreak: false,
                            isLab: true,
                            labPart: 1,
                            labDuration: 'double'
                        };
                        
                        grid[period + 1][day] = {
                            subject: allocation.subject,
                            subjectCode: allocation.subjectCode,
                            teacher: allocation.teacher,
                            isBreak: false,
                            isLab: true,
                            labPart: 2,
                            labDuration: 'double'
                        };
                        
                        // Mark teacher as busy
                        const teacherKey1 = `${allocation.teacher}_${day}_${period}`;
                        const teacherKey2 = `${allocation.teacher}_${day}_${period + 1}`;
                        window.GLOBAL_TEACHER_SCHEDULE[teacherKey1] = true;
                        window.GLOBAL_TEACHER_SCHEDULE[teacherKey2] = true;
                        
                        placed = true;
                    }
                } else {
                    if (canPlaceSinglePeriod(grid, day, period, allocation, data)) {
                        grid[period][day] = {
                            subject: allocation.subject,
                            subjectCode: allocation.subjectCode,
                            teacher: allocation.teacher,
                            isBreak: false,
                            isLab: allocation.isLab
                        };
                        
                        // Mark teacher as busy
                        const teacherKey = `${allocation.teacher}_${day}_${period}`;
                        window.GLOBAL_TEACHER_SCHEDULE[teacherKey] = true;
                        
                        placed = true;
                    }
                }
            }
        }
        
        if (!placed) {
            console.warn(`Could not place: ${allocation.subject}`);
        }
    }
}

// Function to display multiple section timetables
function displayMultipleSectionTimetables(sectionTimetables) {
    const container = document.getElementById('timetableContainer');
    const exportButtons = document.getElementById('exportButtons');
    
    // Show export buttons
    if (exportButtons) {
        exportButtons.style.display = 'block';
    }
    
    let html = '<div class="multiple-sections-container">';
    
    sectionTimetables.sections.forEach((section, index) => {
        html += `
            <div class="section-timetable mb-4">
                <h4 class="section-title mb-3">
                    <i class="fas fa-users me-2"></i>${section.className}
                </h4>
                ${generateTimetableHTML(section)}
            </div>
        `;
        
        if (index < sectionTimetables.sections.length - 1) {
            html += '<hr class="section-divider">';
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Function to calculate actual time based on start time and lecture duration
function calculateTimeSlot(startTime, periodIndex, lectureDuration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    
    const startSlotMinutes = startMinutes + (periodIndex * lectureDuration);
    const endSlotMinutes = startSlotMinutes + lectureDuration;
    
    const formatTime = (totalMinutes) => {
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };
    
    return `${formatTime(startSlotMinutes)} - ${formatTime(endSlotMinutes)}`;
}

// Updated function to generate timetable HTML exactly matching the college format from the image
function generateTimetableHTML(timetable) {
    const { timetableGrid, workingDays, startTime, lectureDuration, breakEnabled, breakStart, breakDurationMinutes } = timetable;
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    let html = '<div class="table-responsive">';
    html += '<table class="table table-bordered college-timetable-table">';
    
    // Header row with time slots
    html += '<thead><tr>';
    html += '<th class="day-time-header">DAY \\ TIME</th>';
    
    // Calculate and display time slots
    const [hours, minutes] = startTime.split(':').map(Number);
    let currentMinutes = hours * 60 + minutes;
    
    for (let period = 0; period < timetable.maxHoursPerDay; period++) {
        // Add break before this period if it's the break period
        if (breakEnabled && period === breakStart && breakDurationMinutes) {
            const breakStartTime = formatTime(currentMinutes);
            const breakEndTime = formatTime(currentMinutes + breakDurationMinutes);
            html += `<th class="break-header">BREAK<br><small>(${breakStartTime}-${breakEndTime})</small></th>`;
            currentMinutes += breakDurationMinutes;
        }
        
        // Add regular period header
        const periodStartTime = formatTime(currentMinutes);
        const periodEndTime = formatTime(currentMinutes + lectureDuration);
        html += `<th class="time-header">${periodStartTime}-${periodEndTime}</th>`;
        currentMinutes += lectureDuration;
    }
    html += '</tr></thead><tbody>';
    
    // Data rows - each day as a row
    for (let day = 0; day < workingDays; day++) {
        html += '<tr>';
        html += `<td class="day-cell">${days[day]}</td>`;
        
        // Reset time tracking for break insertion
        let currentPeriodMinutes = (hours * 60 + minutes);
        
        for (let period = 0; period < timetable.maxHoursPerDay; period++) {
            // Add break cell if this is the break period
            if (breakEnabled && period === breakStart && breakDurationMinutes) {
                html += `<td class="break-cell">BREAK</td>`;
                currentPeriodMinutes += breakDurationMinutes;
            }
            
            const cell = timetableGrid[period][day];
            let cellClass = 'subject-cell';
            let cellContent = '';
            
            if (cell.isBreak) {
                // Skip break cells as they're handled above
                continue;
            } else if (cell.subject === 'Free') {
                cellContent = 'Free';
                cellClass += ' free-cell';
            } else if (!cell.subject || cell.subject === '') {
                cellContent = 'OFF';
                cellClass += ' off-cell';
            } else if (cell.subject) {
                if (cell.isLab) {
                    cellClass += ' lab-cell';
                    if (cell.labPart === 1) {
                        cellContent = `${cell.subjectCode}<br><small>${cell.subject} LAB</small><br><small>${getShortName(cell.teacher)}</small>`;
                    } else {
                        cellContent = `${cell.subjectCode}(CONT)<br><small>${cell.subject} LAB</small><br><small>${getShortName(cell.teacher)}</small>`;
                    }
                } else {
                    cellContent = `${cell.subjectCode}<br><small>${cell.subject}</small><br><small>${getShortName(cell.teacher)}</small>`;
                }
            }
            
            html += `<td class="${cellClass}">${cellContent}</td>`;
            currentPeriodMinutes += lectureDuration;
        }
        html += '</tr>';
    }
    
    html += '</tbody></table></div>';
    return html;
}

// Function to calculate all time slots including breaks
function calculateAllTimeSlots(startTime, maxPeriods, lectureDuration, breakEnabled, breakStart, breakDurationMinutes) {
    const timeSlots = [];
    const [hours, minutes] = startTime.split(':').map(Number);
    let currentMinutes = hours * 60 + minutes;
    
    for (let period = 0; period < maxPeriods; period++) {
        // Add break before this period if it's the break period
        if (breakEnabled && period === breakStart && breakDurationMinutes) {
            const breakStartTime = formatTime(currentMinutes);
            const breakEndTime = formatTime(currentMinutes + breakDurationMinutes);
            timeSlots.push({
                time: `${breakStartTime} - ${breakEndTime}`,
                isBreak: true
            });
            currentMinutes += breakDurationMinutes;
        }
        
        // Add regular period
        const periodStartTime = formatTime(currentMinutes);
        const periodEndTime = formatTime(currentMinutes + lectureDuration);
        timeSlots.push({
            time: `${periodStartTime} - ${periodEndTime}`,
            isBreak: false
        });
        currentMinutes += lectureDuration;
    }
    
    return timeSlots;
}

// Helper function to get short name (initials or first name)
function getShortName(fullName) {
    if (!fullName) return '';
    
    const words = fullName.trim().split(' ');
    if (words.length === 1) {
        // Single word - return first 8 characters
        return words[0].substring(0, 8);
    } else {
        // Multiple words - return initials
        return words.map(word => word.charAt(0).toUpperCase()).join('.');
    }
}

// Helper function to format time
function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function displayTimetable(timetableData) {
    const container = document.getElementById('timetableContainer');
    const exportButtons = document.getElementById('exportButtons');
    
    if (!container) return;
    
    currentTimetableData = timetableData;
    
    // Generate timetable HTML with time display
    const timetableHtml = generateTimetableHTML(timetableData);
    container.innerHTML = timetableHtml;
    
    // Show export buttons
    if (exportButtons) {
        exportButtons.style.display = 'block';
    }
    
    // Add animation to the timetable
    const table = container.querySelector('.timetable-table');
    if (table) {
        table.classList.add('animate-fade-in');
    }
}

function exportTimetable(format) {
    if (!currentTimetableData) {
        showToast('No timetable to export', 'warning');
        return;
    }
    
    exportTimetableData(currentTimetableData, format);
}

// Initialize generator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // This will be called from the individual timetable pages
    // with the appropriate generator type
});

// Export generator functions
window.GeneratorModule = {
    initializeGenerator,
    addSubject,
    removeSubject,
    addTeacherToSubject,
    removeTeacher,
    toggleLabOptions,
    handleTimetableGeneration,
    exportTimetable,
    loadSavedSubjects
};
