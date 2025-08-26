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
        // RESET master allocation plan and teacher schedule for new generation
        window.MASTER_ALLOCATION_PLAN = null;
        window.GLOBAL_TEACHER_SCHEDULE = {};
        
        const sections = [];
        // Global teacher schedule to prevent conflicts across sections
        // Format: { "teacherName_day_period": true }
        const globalTeacherSchedule = {};
        
        console.log(`Generating conflict-free timetables for ${data.numberOfSections} sections...`);
        
        // PRE-CREATE the master allocation plan ONCE for ALL sections
        const totalSlots = data.workingDays * data.maxHoursPerDay;
        const slotsPerSubject = Math.floor(totalSlots / data.subjects.length);
        const masterAllocationPlan = {};
        
        console.log(`Creating MASTER allocation plan for ${data.subjects.length} subjects:`);
        data.subjects.forEach(subject => {
            const isDoubleLab = subject.isLab && subject.labDuration === 'double';
            
            if (isDoubleLab) {
                const labSessions = Math.floor(slotsPerSubject / 2);
                masterAllocationPlan[subject.name] = {
                    type: 'doubleLab',
                    sessions: labSessions,
                    isLab: true,
                    labDuration: 'double'
                };
                console.log(`  ${subject.name}: ${labSessions} double-lab sessions (${labSessions * 2} total periods)`);
            } else {
                masterAllocationPlan[subject.name] = {
                    type: 'regular',
                    sessions: slotsPerSubject,
                    isLab: subject.isLab || false,
                    labDuration: subject.labDuration || 'regular'
                };
                console.log(`  ${subject.name}: ${slotsPerSubject} ${subject.isLab ? 'single-lab' : 'theory'} sessions`);
            }
        });
        
        // Generate each section using the SAME master plan
        for (let sectionNum = 1; sectionNum <= data.numberOfSections; sectionNum++) {
            // Check timeout
            if (Date.now() - startTime > TIMEOUT_MS) {
                console.error('Timetable generation timeout - stopping to prevent infinite loop');
                return null;
            }
            
            const sectionData = {
                ...data,
                className: `${data.className} - Section ${sectionNum}`,
                sectionNumber: sectionNum,
                globalTeacherSchedule: globalTeacherSchedule, // Pass global schedule to prevent conflicts
                globalAllocationPlan: masterAllocationPlan // Use FIXED master plan for ALL sections
            };
            
            // Distribute teachers across sections
            const adjustedSubjects = distributeTeachersSimple(data.subjects, sectionNum, data.numberOfSections);
            sectionData.subjects = adjustedSubjects;
            
            console.log(`Generating Section ${sectionNum} with FIXED allocation plan...`);
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
    
    // STEP 2: Create MASTER ALLOCATION PLAN (same for ALL sections)
    if (!window.MASTER_ALLOCATION_PLAN) {
        console.log('\n=== CREATING MASTER ALLOCATION PLAN ===');
        window.MASTER_ALLOCATION_PLAN = {};
        
        const periodsPerSubject = Math.floor(availableForSubjects / subjects.length);
        const remainingPeriods = availableForSubjects % subjects.length;
        
        console.log(`Base periods per subject: ${periodsPerSubject}`);
        console.log(`Extra periods to distribute: ${remainingPeriods}`);
        
        // Separate subjects by priority and type
        const highPrioritySubjects = subjects.filter(s => s.priority === 'High');
        const mediumPrioritySubjects = subjects.filter(s => s.priority === 'Medium');
        const lowPrioritySubjects = subjects.filter(s => s.priority === 'Low');
        
        console.log(`Priority breakdown: High=${highPrioritySubjects.length}, Medium=${mediumPrioritySubjects.length}, Low=${lowPrioritySubjects.length}`);
        
        // Calculate minimum periods needed
        let periodsUsed = 0;
        
        let remainingToDistribute = remainingPeriods;
        
        subjects.forEach((subject, index) => {
            // Base allocation
            let subjectPeriods = periodsPerSubject;
            
                // Distribute extra periods to high priority subjects evenly
            if (remainingToDistribute > 0) {
                if (subject.priority === 'High') {
                    // Give extra periods to high priority subjects first
                    const extraForHigh = Math.ceil(remainingToDistribute / highPrioritySubjects.length);
                    const actualExtra = Math.min(extraForHigh, remainingToDistribute);
                    subjectPeriods += actualExtra;
                    remainingToDistribute -= actualExtra;
                } else if (subject.priority === 'Medium' && highPrioritySubjects.length === 0) {
                    // If no high priority, give to medium priority
                    const extraForMedium = Math.ceil(remainingToDistribute / mediumPrioritySubjects.length);
                    const actualExtra = Math.min(extraForMedium, remainingToDistribute);
                    subjectPeriods += actualExtra;
                    remainingToDistribute -= actualExtra;
                } else if (subject.priority === 'Low' && highPrioritySubjects.length === 0 && mediumPrioritySubjects.length === 0) {
                    // If no high or medium priority, give to low priority
                    const extraForLow = Math.ceil(remainingToDistribute / lowPrioritySubjects.length);
                    const actualExtra = Math.min(extraForLow, remainingToDistribute);
                    subjectPeriods += actualExtra;
                    remainingToDistribute -= actualExtra;
                }
            }
            
            // Handle lab configuration
            if (subject.isLab && subject.labDuration === 'double') {
                // Double labs - need pairs of periods
                const labSessions = Math.floor(subjectPeriods / 2);
                const actualPeriods = labSessions * 2;
                
                window.MASTER_ALLOCATION_PLAN[subject.name] = {
                    totalPeriods: actualPeriods,
                    labSessions: labSessions,
                    isLab: true,
                    labType: 'double',
                    singlePeriods: 0,
                    priority: subject.priority
                };
                periodsUsed += actualPeriods;
                console.log(`${subject.name} (${subject.priority}): ${labSessions} double labs (${actualPeriods} periods)`);
            } else if (subject.isLab) {
                // Single period labs
                window.MASTER_ALLOCATION_PLAN[subject.name] = {
                    totalPeriods: subjectPeriods,
                    labSessions: subjectPeriods,
                    isLab: true,
                    labType: 'single',
                    singlePeriods: subjectPeriods,
                    priority: subject.priority
                };
                periodsUsed += subjectPeriods;
                console.log(`${subject.name} (${subject.priority}): ${subjectPeriods} single labs`);
            } else {
                // Theory subjects
                window.MASTER_ALLOCATION_PLAN[subject.name] = {
                    totalPeriods: subjectPeriods,
                    labSessions: 0,
                    isLab: false,
                    labType: 'theory',
                    singlePeriods: subjectPeriods,
                    priority: subject.priority
                };
                periodsUsed += subjectPeriods;
                console.log(`${subject.name} (${subject.priority}): ${subjectPeriods} theory periods`);
            }
        });
        
        // FORCE DISTRIBUTE ALL REMAINING PERIODS to ensure no OFF periods
        const actualRemainingToDistribute = availableForSubjects - periodsUsed;
        console.log(`Periods used: ${periodsUsed}, Remaining MUST distribute: ${actualRemainingToDistribute}`);
        
        if (actualRemainingToDistribute > 0) {
            console.log(`FORCE distributing ${actualRemainingToDistribute} periods to prevent OFF periods`);
            let distributedExtra = 0;
            
            // First try high priority non-lab subjects
            for (let i = 0; i < actualRemainingToDistribute && distributedExtra < actualRemainingToDistribute; i++) {
                const targetSubject = highPrioritySubjects.length > 0 ? 
                    highPrioritySubjects[i % highPrioritySubjects.length] : 
                    subjects[i % subjects.length];
                    
                const plan = window.MASTER_ALLOCATION_PLAN[targetSubject.name];
                
                if (!plan.isLab || plan.labType !== 'double') {
                    // Add extra periods to theory or single lab subjects
                    plan.totalPeriods++;
                    plan.singlePeriods++;
                    distributedExtra++;
                    console.log(`FORCE added extra period to ${targetSubject.name} (total: ${plan.totalPeriods})`);
                }
            }
            
            // If still have remaining, distribute to ANY subject
            for (let i = 0; distributedExtra < actualRemainingToDistribute && i < subjects.length * 3; i++) {
                const targetSubject = subjects[i % subjects.length];
                const plan = window.MASTER_ALLOCATION_PLAN[targetSubject.name];
                
                plan.totalPeriods++;
                if (plan.isLab && plan.labType === 'double') {
                    // Convert one double lab to two single periods if needed
                    plan.singlePeriods += 2;
                } else {
                    plan.singlePeriods++;
                }
                distributedExtra++;
                console.log(`EMERGENCY added period to ${targetSubject.name} (total: ${plan.totalPeriods})`);
            }
        }
    }
    
    // STEP 3: Generate optimized subject allocation list for this section
    const subjectList = [];
    const theorySubjects = [];
    const labSubjects = [];
    
    subjects.forEach(subject => {
        const plan = window.MASTER_ALLOCATION_PLAN[subject.name];
        const teacher = subject.teachers[0];
        
        console.log(`\nSection ${data.sectionNumber} - ${subject.name}:`);
        console.log(`  Plan: ${plan.totalPeriods} total periods`);
        
        if (plan.labType === 'double') {
            // Add double lab sessions
            for (let i = 0; i < plan.labSessions; i++) {
                const labItem = {
                    subject: subject.name,
                    subjectCode: subject.code,
                    teacher: teacher,
                    isLab: true,
                    labType: 'double',
                    priority: plan.priority,
                    sessionId: `${subject.name}_double_${i}`
                };
                subjectList.push(labItem);
                labSubjects.push(labItem);
                console.log(`  Added double lab ${i + 1}`);
            }
        } else {
            // Add single period sessions (labs or theory)
            for (let i = 0; i < plan.singlePeriods; i++) {
                const item = {
                    subject: subject.name,
                    subjectCode: subject.code,
                    teacher: teacher,
                    isLab: plan.isLab,
                    labType: plan.labType,
                    priority: plan.priority,
                    sessionId: `${subject.name}_single_${i}`
                };
                subjectList.push(item);
                
                if (plan.isLab) {
                    labSubjects.push(item);
                } else {
                    theorySubjects.push(item);
                }
                console.log(`  Added ${plan.labType} period ${i + 1}`);
            }
        }
    });
    
    console.log(`\nSection ${data.sectionNumber}: Total periods to allocate: ${subjectList.length}`);
    console.log(`  Theory periods: ${theorySubjects.length}`);
    console.log(`  Lab periods: ${labSubjects.length}`);
    
    // STEP 4: OPTIMIZED DAY-BY-DAY ALLOCATION - Avoid consecutive same theory subjects
    console.log(`\n=== STARTING OPTIMIZED DAY-BY-DAY ALLOCATION ===`);
    
    // Initialize global teacher schedule if not exists
    if (!window.GLOBAL_TEACHER_SCHEDULE) {
        window.GLOBAL_TEACHER_SCHEDULE = {};
    }
    
    let allocatedCount = 0;
    
    // Sort subjects to prioritize labs first, then distribute theory subjects
    const sortedSubjects = [...subjectList].sort((a, b) => {
        if (a.isLab && !b.isLab) return -1; // Labs first
        if (!a.isLab && b.isLab) return 1;
        if (a.priority === 'High' && b.priority !== 'High') return -1; // High priority first
        if (a.priority !== 'High' && b.priority === 'High') return 1;
        return 0;
    });
    
    for (const item of sortedSubjects) {
        let allocated = false;
        let attempts = 0;
        const maxAttempts = totalSlots * 2;
        
        // Try each slot with smart placement logic
        for (let day = 0; day < workingDays && !allocated; day++) {
            for (let period = 0; period < maxHoursPerDay && !allocated; period++) {
                attempts++;
                if (attempts > maxAttempts) break;
                
                // Skip break periods
                if (data.breakEnabled && period === data.breakStart) {
                    continue;
                }
                
                if (item.labType === 'double') {
                    // Need 2 consecutive periods for double labs
                    if (period < maxHoursPerDay - 1 && 
                        !grid[period][day].subject && 
                        !grid[period + 1][day].subject &&
                        !(data.breakEnabled && (period + 1 === data.breakStart))) {
                        
                        // Check teacher availability for both periods
                        const teacherKey1 = `${item.teacher}_${day}_${period}`;
                        const teacherKey2 = `${item.teacher}_${day}_${period + 1}`;
                        
                        if (!window.GLOBAL_TEACHER_SCHEDULE[teacherKey1] && 
                            !window.GLOBAL_TEACHER_SCHEDULE[teacherKey2]) {
                            
                            // Allocate double lab
                            grid[period][day] = {
                                subject: item.subject,
                                subjectCode: item.subjectCode,
                                teacher: item.teacher,
                                isBreak: false,
                                isLab: true,
                                labPart: 1,
                                labDuration: 'double'
                            };
                            
                            grid[period + 1][day] = {
                                subject: item.subject,
                                subjectCode: item.subjectCode,
                                teacher: item.teacher,
                                isBreak: false,
                                isLab: true,
                                labPart: 2,
                                labDuration: 'double'
                            };
                            
                            // Mark teacher as busy globally
                            window.GLOBAL_TEACHER_SCHEDULE[teacherKey1] = true;
                            window.GLOBAL_TEACHER_SCHEDULE[teacherKey2] = true;
                            
                            allocated = true;
                            allocatedCount++;
                            console.log(`✓ Double lab ${item.subject} (${item.teacher}) allocated to Day${day+1} P${period+1}-${period+2}`);
                        }
                    }
                } else {
                    // Single period - check for consecutive theory subjects
                    if (!grid[period][day].subject) {
                        // Check teacher availability
                        const teacherKey = `${item.teacher}_${day}_${period}`;
                        
                        if (!window.GLOBAL_TEACHER_SCHEDULE[teacherKey]) {
                            // For theory subjects, avoid consecutive same subjects
                            let canPlace = true;
                            if (!item.isLab) {
                                // Check previous period on same day
                                if (period > 0 && grid[period - 1][day].subject === item.subject) {
                                    canPlace = false;
                                }
                                // Check next period on same day
                                if (period < maxHoursPerDay - 1 && grid[period + 1][day].subject === item.subject) {
                                    canPlace = false;
                                }
                            }
                            
                            if (canPlace) {
                                grid[period][day] = {
                                    subject: item.subject,
                                    subjectCode: item.subjectCode,
                                    teacher: item.teacher,
                                    isBreak: false,
                                    isLab: item.isLab,
                                    labDuration: item.labType === 'single' ? 'single' : 'regular'
                                };
                                
                                // Mark teacher as busy globally
                                window.GLOBAL_TEACHER_SCHEDULE[teacherKey] = true;
                                
                                allocated = true;
                                allocatedCount++;
                                console.log(`✓ ${item.labType} ${item.subject} (${item.teacher}) allocated to Day${day+1} P${period+1}`);
                            }
                        }
                    }
                }
            }
        }
        
        if (!allocated) {
            console.error(`❌ FAILED to allocate ${item.subject} (${item.teacher}) - teacher conflicts or grid full`);
            
            // Force allocation if we must (fallback to ensure consistency)
            for (let day = 0; day < workingDays && !allocated; day++) {
                for (let period = 0; period < maxHoursPerDay && !allocated; period++) {
                    if (data.breakEnabled && period === data.breakStart) continue;
                    
                    if (item.labType === 'double') {
                        if (period < maxHoursPerDay - 1 && 
                            !grid[period][day].subject && 
                            !grid[period + 1][day].subject &&
                            !(data.breakEnabled && (period + 1 === data.breakStart))) {
                            
                            grid[period][day] = {
                                subject: item.subject,
                                subjectCode: item.subjectCode,
                                teacher: item.teacher,
                                isBreak: false,
                                isLab: true,
                                labPart: 1,
                                labDuration: 'double'
                            };
                            
                            grid[period + 1][day] = {
                                subject: item.subject,
                                subjectCode: item.subjectCode,
                                teacher: item.teacher,
                                isBreak: false,
                                isLab: true,
                                labPart: 2,
                                labDuration: 'double'
                            };
                            
                            allocated = true;
                            console.warn(`⚠️ FORCED double lab allocation ${item.subject} (${item.teacher}) at Day${day+1} P${period+1}-${period+2}`);
                        }
                    } else {
                        if (!grid[period][day].subject) {
                            grid[period][day] = {
                                subject: item.subject,
                                subjectCode: item.subjectCode,
                                teacher: item.teacher,
                                isBreak: false,
                                isLab: item.isLab,
                                labDuration: item.labType === 'single' ? 'single' : 'regular'
                            };
                            
                            allocated = true;
                            console.warn(`⚠️ FORCED allocation ${item.subject} (${item.teacher}) at Day${day+1} P${period+1}`);
                        }
                    }
                }
            }
        }
    }
    
    // STEP 5: Fill breaks
    if (data.breakEnabled) {
        for (let day = 0; day < workingDays; day++) {
            if (!grid[data.breakStart][day].subject) {
                grid[data.breakStart][day] = {
                    subject: 'Break',
                    teacher: '',
                    subjectCode: '',
                    isBreak: true
                };
            }
        }
    }
    
    // STEP 6: Fill remaining slots with priority subjects (NO free lectures if freeLectures = 0)
    console.log(`\n=== FILLING REMAINING SLOTS ===`);
    
    // Count empty slots
    let emptySlots = 0;
    const emptyPositions = [];
    
    for (let period = 0; period < maxHoursPerDay; period++) {
        for (let day = 0; day < workingDays; day++) {
            if (!grid[period][day].subject) {
                emptySlots++;
                emptyPositions.push({period, day});
            }
        }
    }
    
    console.log(`Found ${emptySlots} empty slots, freeLectures setting: ${freeLectures}`);
    
    if (freeLectures === 0 && emptySlots > 0) {
        // Fill empty slots with high priority subjects to avoid OFF periods
        console.log(`Filling ${emptySlots} empty slots with high priority subjects...`);
        
        const highPrioritySubjects = subjects.filter(s => s.priority === 'High' && !s.isLab);
        if (highPrioritySubjects.length === 0) {
            // Fallback to any non-lab subjects
            const fallbackSubjects = subjects.filter(s => !s.isLab);
            highPrioritySubjects.push(...fallbackSubjects);
        }
        
        let subjectIndex = 0;
        for (const pos of emptyPositions) {
            if (highPrioritySubjects.length > 0) {
                const subject = highPrioritySubjects[subjectIndex % highPrioritySubjects.length];
                const teacher = subject.teachers[0];
                
                // Check teacher availability
                const teacherKey = `${teacher}_${pos.day}_${pos.period}`;
                
                if (!window.GLOBAL_TEACHER_SCHEDULE[teacherKey]) {
                    grid[pos.period][pos.day] = {
                        subject: subject.name,
                        subjectCode: subject.code,
                        teacher: teacher,
                        isBreak: false,
                        isLab: false,
                        priority: 'Extra'
                    };
                    
                    // Mark teacher as busy
                    window.GLOBAL_TEACHER_SCHEDULE[teacherKey] = true;
                    console.log(`✓ Filled empty slot Day${pos.day+1} P${pos.period+1} with ${subject.name} (${teacher})`);
                } else {
                    // Teacher conflict, try next subject or leave as Free
                    grid[pos.period][pos.day] = {
                        subject: 'Study',
                        teacher: '',
                        subjectCode: '',
                        isBreak: false
                    };
                    console.log(`⚠️ Teacher conflict at Day${pos.day+1} P${pos.period+1}, marked as Study period`);
                }
                subjectIndex++;
            }
        }
    } else if (freeLectures > 0) {
        // Fill with Free periods as requested
        for (const pos of emptyPositions) {
            grid[pos.period][pos.day] = {
                subject: 'Free',
                teacher: '',
                subjectCode: '',
                isBreak: false
            };
        }
        console.log(`Filled ${emptySlots} slots with Free periods as requested`);
    }
    
    console.log(`Slot filling complete`);
    
    // STEP 7: Final verification
    console.log(`\n=== FINAL VERIFICATION Section ${data.sectionNumber} ===`);
    const subjectCounts = {};
    const labCounts = {};
    let freeCount = 0;
    
    for (let period = 0; period < maxHoursPerDay; period++) {
        for (let day = 0; day < workingDays; day++) {
            const cell = grid[period][day];
            if (cell.subject === 'Free') {
                freeCount++;
            } else if (cell.subject && cell.subject !== 'Break' && cell.subject !== 'ERROR') {
                subjectCounts[cell.subject] = (subjectCounts[cell.subject] || 0) + 1;
                if (cell.isLab) {
                    labCounts[cell.subject] = (labCounts[cell.subject] || 0) + 1;
                }
            }
        }
    }
    
    console.log(`Subject counts:`, subjectCounts);
    console.log(`Lab counts:`, labCounts);
    console.log(`Free periods: ${freeCount} (expected: ${freeLectures})`);
    
    return {
        ...data,
        timetableGrid: grid
    };
}

// Timeout-protected allocation function
function allocateSubjectsWithTimeout(grid, allocationPlan, data, startTime, timeoutMs) {
    const { workingDays, maxHoursPerDay } = data;
    
    // Simple round-robin allocation to prevent infinite loops
    let currentSlot = 0;
    const totalSlots = workingDays * maxHoursPerDay;
    
    for (const allocation of allocationPlan) {
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
            console.warn('Allocation timeout reached');
            return false;
        }
        
        // Find next available slot
        let allocated = false;
        let attempts = 0;
        const maxAttempts = totalSlots;
        
        while (!allocated && attempts < maxAttempts) {
            if (currentSlot >= totalSlots) {
                currentSlot = 0; // Wrap around
            }
            
            const day = Math.floor(currentSlot / maxHoursPerDay);
            const period = currentSlot % maxHoursPerDay;
            
            if (day < workingDays && period < maxHoursPerDay && !grid[period][day].subject) {
                grid[period][day] = {
                    subject: allocation.subject,
                    subjectCode: allocation.subjectCode,
                    teacher: allocation.teacher,
                    isBreak: false
                };
                allocated = true;
            }
            
            currentSlot++;
            attempts++;
        }
        
        if (!allocated) {
            console.warn('Could not allocate:', allocation.subject);
        }
    }
    
    // Only fill remaining slots with "Free" if freeLectures parameter allows it
    const allowedFreeLectures = parseInt(data.freeLectures) || 0;
    let freeSlotsFilled = 0;
    
    if (allowedFreeLectures > 0) {
        for (let period = 0; period < maxHoursPerDay; period++) {
            for (let day = 0; day < workingDays; day++) {
                if (!grid[period][day].subject && freeSlotsFilled < allowedFreeLectures) {
                    grid[period][day] = {
                        subject: 'Free',
                        teacher: '',
                        subjectCode: '',
                        isBreak: false
                    };
                    freeSlotsFilled++;
                }
            }
        }
    } else {
        // When freeLectures = 0, fill ALL remaining empty slots with high priority subjects
        for (let period = 0; period < maxHoursPerDay; period++) {
            for (let day = 0; day < workingDays; day++) {
                if (!grid[period][day].subject) {
                    const highPrioritySubjects = data.subjects.filter(s => s.priority === 'High');
                    if (highPrioritySubjects.length > 0) {
                        const randomSubject = highPrioritySubjects[Math.floor(Math.random() * highPrioritySubjects.length)];
                        const randomTeacher = randomSubject.teachers[Math.floor(Math.random() * randomSubject.teachers.length)];
                        grid[period][day] = {
                            subject: randomSubject.name,
                            teacher: randomTeacher,
                            subjectCode: randomSubject.code,
                            isBreak: false
                        };
                    } else {
                        // No high priority subjects, use any subject
                        const randomSubject = data.subjects[Math.floor(Math.random() * data.subjects.length)];
                        const randomTeacher = randomSubject.teachers[Math.floor(Math.random() * randomSubject.teachers.length)];
                        grid[period][day] = {
                            subject: randomSubject.name,
                            teacher: randomTeacher,
                            subjectCode: randomSubject.code,
                            isBreak: false
                        };
                    }
                }
            }
        }
    }
    
    return true;
}

// Function to update teacher usage tracking
function updateTeacherUsage(timetable, teacherUsage) {
    timetable.timetableGrid.forEach(row => {
        row.forEach(cell => {
            if (cell.subject && cell.teacher) {
                const usageKey = `${cell.teacher}_${cell.subjectCode}`;
                teacherUsage[usageKey] = (teacherUsage[usageKey] || 0) + 1;
            }
        });
    });
}

// Enhanced allocation function with constraints for better timetable distribution
function allocateSubjectsToGridStrict(grid, allocationPlan, data) {
    const { workingDays, maxHoursPerDay, globalTeacherSchedule } = data;
    
    // Use global teacher schedule if available (for multi-section), otherwise create local one
    const teacherSchedule = globalTeacherSchedule || {};
    const dailyAllocations = {}; // Track allocations per day
    const dailySubjectCount = {}; // Track how many times each subject appears per day
    
    // Initialize tracking structures
    for (let day = 0; day < workingDays; day++) {
        dailyAllocations[day] = 0;
        dailySubjectCount[day] = {};
    }
    
    // Initialize global lab tracking for multiple sections
    if (!data.globalLabTracker) {
        data.globalLabTracker = {};
    }
    
    // Sort allocation plan by priority and lab requirements
    allocationPlan.sort((a, b) => {
        // Labs with double duration get highest priority
        if (a.isLab && a.labDuration === 'double' && (!b.isLab || b.labDuration !== 'double')) return -1;
        if (b.isLab && b.labDuration === 'double' && (!a.isLab || a.labDuration !== 'double')) return 1;
        
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Helper function to check if placing a subject would create consecutive duplicates
    function wouldCreateConsecutive(subject, day, period) {
        // Check previous period (if exists)
        if (period > 0 && grid[period - 1][day].subject === subject && !grid[period - 1][day].isLab) {
            return true;
        }
        // Check next period (if exists) 
        if (period < maxHoursPerDay - 1 && grid[period + 1][day].subject === subject && !grid[period + 1][day].isLab) {
            return true;
        }
        return false;
    }
    
    // Helper function to get diversity score for a day (higher = more diverse)
    function getDiversityScore(day, excludePeriod = -1) {
        const subjectsInDay = new Set();
        for (let p = 0; p < maxHoursPerDay; p++) {
            if (p !== excludePeriod && grid[p][day].subject && grid[p][day].subject !== 'OFF') {
                subjectsInDay.add(grid[p][day].subject);
            }
        }
        return subjectsInDay.size;
    }
    
    // Helper function to find best slots for a subject (considering diversity and no consecutive rule)
    function findBestSlots(allocation, isDoubleSlot = false) {
        const candidates = [];
        
        for (let day = 0; day < workingDays; day++) {
            if (dailyAllocations[day] >= maxHoursPerDay) continue;
            
            if (isDoubleSlot) {
                // For double lab slots
                for (let period = 0; period < maxHoursPerDay - 1; period++) {
                    if (!grid[period][day].subject && !grid[period + 1][day].subject) {
                        const teacherKey1 = `${allocation.teacher}_${day}_${period}`;
                        const teacherKey2 = `${allocation.teacher}_${day}_${period + 1}`;
                        
                        if (!teacherSchedule[teacherKey1] && !teacherSchedule[teacherKey2] && 
                            dailyAllocations[day] + 2 <= maxHoursPerDay) {
                            
                            // Track lab distribution across sections
                            const labKey = `${allocation.subjectCode}_lab`;
                            const currentLabCount = data.globalLabTracker[labKey] || 0;
                            
                            candidates.push({
                                day,
                                period,
                                priority: 100, // Labs get highest priority
                                labCount: currentLabCount
                            });
                        }
                    }
                }
            } else {
                // For regular subjects
                for (let period = 0; period < maxHoursPerDay; period++) {
                    if (!grid[period][day].subject) {
                        const teacherKey = `${allocation.teacher}_${day}_${period}`;
                        
                        if (!teacherSchedule[teacherKey] && dailyAllocations[day] + 1 <= maxHoursPerDay) {
                            let score = 0;
                            
                            // Heavily penalize consecutive same subjects
                            if (wouldCreateConsecutive(allocation.subject, day, period)) {
                                score -= 1000;
                            }
                            
                            // Reward diversity (fewer of this subject in the day)
                            const subjectCountInDay = dailySubjectCount[day][allocation.subject] || 0;
                            score += (5 - subjectCountInDay) * 10;
                            
                            // Reward overall day diversity
                            score += getDiversityScore(day, period) * 5;
                            
                            // For high priority subjects, add randomness to avoid clustering on specific days
                            if (allocation.priority === 'high') {
                                // Add random factor to distribute high priority subjects across all days
                                score += Math.random() * 20;
                                // Remove the day preference that was causing Friday clustering
                            } else {
                                // Keep slight preference for spreading across different days for normal subjects
                                score += (workingDays - day) * 2;
                            }
                            
                            candidates.push({
                                day,
                                period,
                                priority: score
                            });
                        }
                    }
                }
            }
        }
        
        // Sort candidates by priority (higher is better)
        candidates.sort((a, b) => {
            if (isDoubleSlot) {
                // For labs, prioritize balanced distribution across sections
                return (a.labCount || 0) - (b.labCount || 0);
            }
            return b.priority - a.priority;
        });
        
        return candidates;
    }
    
    for (const allocation of allocationPlan) {
        let allocated = false;
        
        if (allocation.isLab && allocation.labDuration === 'double') {
            // Handle double-period labs
            const candidates = findBestSlots(allocation, true);
            
            for (const candidate of candidates) {
                const { day, period } = candidate;
                
                // Allocate both periods for lab
                grid[period][day] = {
                    subject: allocation.subject,
                    subjectCode: allocation.subjectCode,
                    teacher: allocation.teacher,
                    isBreak: false,
                    isLab: true,
                    labPart: 1
                };
                grid[period + 1][day] = {
                    subject: allocation.subject,
                    subjectCode: allocation.subjectCode,
                    teacher: allocation.teacher,
                    isBreak: false,
                    isLab: true,
                    labPart: 2
                };
                
                const teacherKey1 = `${allocation.teacher}_${day}_${period}`;
                const teacherKey2 = `${allocation.teacher}_${day}_${period + 1}`;
                teacherSchedule[teacherKey1] = true;
                teacherSchedule[teacherKey2] = true;
                dailyAllocations[day] += 2;
                
                // Track lab allocation for section balancing
                const labKey = `${allocation.subjectCode}_lab`;
                data.globalLabTracker[labKey] = (data.globalLabTracker[labKey] || 0) + 1;
                
                allocation.allocated = true;
                allocated = true;
                break;
            }
        } else {
            // Handle regular theory subjects with enhanced constraints
            const candidates = findBestSlots(allocation, false);
            
            for (const candidate of candidates) {
                const { day, period } = candidate;
                
                if (data.sectionNumber) {
                    console.log(`✓ Section ${data.sectionNumber}: ${allocation.teacher} allocated to Day ${day+1} Period ${period+1} for ${allocation.subject}`);
                }
                
                // Allocate the slot
                grid[period][day] = {
                    subject: allocation.subject,
                    subjectCode: allocation.subjectCode,
                    teacher: allocation.teacher,
                    isBreak: false
                };
                
                const teacherKey = `${allocation.teacher}_${day}_${period}`;
                teacherSchedule[teacherKey] = true;
                dailyAllocations[day] += 1;
                
                // Update daily subject count
                if (!dailySubjectCount[day][allocation.subject]) {
                    dailySubjectCount[day][allocation.subject] = 0;
                }
                dailySubjectCount[day][allocation.subject]++;
                
                allocation.allocated = true;
                allocated = true;
                break;
            }
        }
        
        if (!allocated) {
            console.warn('Could not allocate with constraints:', allocation);
        }
    }
    
    // Before filling with "OFF", check for high priority subjects that can fill empty slots
    const emptySlots = [];
    for (let day = 0; day < workingDays; day++) {
        for (let period = 0; period < maxHoursPerDay; period++) {
            if (!grid[period][day].subject) {
                emptySlots.push({ day, period });
            }
        }
    }
    
    // If there are empty slots and high priority subjects exist, fill them
    if (emptySlots.length > 0 && data.subjects) {
        const highPrioritySubjects = data.subjects.filter(subject => subject.priority === 'high');
        
        if (highPrioritySubjects.length > 0) {
            console.log(`Found ${emptySlots.length} empty slots to fill with ${highPrioritySubjects.length} high priority subjects`);
            
            // Shuffle empty slots to ensure random distribution across days
            for (let i = emptySlots.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [emptySlots[i], emptySlots[j]] = [emptySlots[j], emptySlots[i]];
            }
            
            // Distribute empty slots equally among high priority subjects
            const slotsPerSubject = Math.floor(emptySlots.length / highPrioritySubjects.length);
            const leftoverSlots = emptySlots.length % highPrioritySubjects.length;
            
            let slotIndex = 0;
            highPrioritySubjects.forEach((subject, subjectIndex) => {
                const slotsForThisSubject = slotsPerSubject + (subjectIndex < leftoverSlots ? 1 : 0);
                
                for (let i = 0; i < slotsForThisSubject && slotIndex < emptySlots.length; i++) {
                    const slot = emptySlots[slotIndex];
                    const teacher = subject.teachers[i % subject.teachers.length]; // Rotate through teachers
                    
                    // Check teacher availability across sections for this time slot
                    const teacherKey = `${teacher}_${slot.day}_${slot.period}`;
                    
                    if (!teacherSchedule[teacherKey]) {
                        grid[slot.period][slot.day] = {
                            subject: subject.name,
                            subjectCode: subject.code,
                            teacher: teacher,
                            isBreak: false,
                            priority: 'high'
                        };
                        
                        // Mark teacher as busy at this time
                        teacherSchedule[teacherKey] = true;
                        slotIndex++;
                    } else {
                        // If teacher is busy, try next slot
                        i--;
                    }
                }
            });
            
            console.log(`Filled ${slotIndex} empty slots with high priority subjects randomly distributed`);
        }
    }
    
    // Fill remaining empty slots based on freeLectures setting
    const freeLecturesAllowed = parseInt(data.freeLectures) || 0;
    let freeSlotsFilled = 0;
    let remainingEmptySlots = [];
    
    // Count and log empty slots
    for (let day = 0; day < workingDays; day++) {
        for (let period = 0; period < maxHoursPerDay; period++) {
            if (!grid[period][day].subject) {
                emptySlots.push({day, period});
            }
        }
    }
    
    console.log(`Found ${remainingEmptySlots.length} empty slots to fill. Free lectures allowed: ${freeLecturesAllowed}`);
    
    // Fill empty slots
    for (const {day, period} of remainingEmptySlots) {
        if (freeSlotsFilled < freeLecturesAllowed) {
            // Fill with Free period
            grid[period][day] = {
                subject: 'Free',
                teacher: '',
                subjectCode: '',
                isBreak: false
            };
            freeSlotsFilled++;
            console.log(`Filled slot [${period}][${day}] with Free period`);
        } else {
            // Fill with high priority subjects
            const highPrioritySubjects = data.subjects.filter(s => s.priority === 'High');
            const subjectsToUse = highPrioritySubjects.length > 0 ? highPrioritySubjects : data.subjects;
            
            const randomSubject = subjectsToUse[Math.floor(Math.random() * subjectsToUse.length)];
            const randomTeacher = randomSubject.teachers[Math.floor(Math.random() * randomSubject.teachers.length)];
            
            grid[period][day] = {
                subject: randomSubject.name,
                teacher: randomTeacher,
                subjectCode: randomSubject.code,
                isBreak: false
            };
            console.log(`Filled slot [${period}][${day}] with ${randomSubject.name}`);
        }
    }
    
    console.log(`Final grid check - all slots filled: ${remainingEmptySlots.length} slots processed`);
    
    return true;
}

// FUNCTION: Generate full schedule when freeLectures = 0
function generateFullSchedule(grid, data, subjects, workingDays, maxHoursPerDay, totalBreakPeriods) {
    console.log('\n=== GENERATING FULL SCHEDULE (NO FREE PERIODS) ===');
    
    // Calculate total available slots for subjects
    const totalSlots = workingDays * maxHoursPerDay - totalBreakPeriods;
    
    // Separate subjects by priority
    const highPrioritySubjects = subjects.filter(s => s.priority === 'High');
    const mediumPrioritySubjects = subjects.filter(s => s.priority === 'Medium');
    const lowPrioritySubjects = subjects.filter(s => s.priority === 'Low');
    
    console.log(`Priority breakdown: High=${highPrioritySubjects.length}, Medium=${mediumPrioritySubjects.length}, Low=${lowPrioritySubjects.length}`);
    
    // Calculate periods per subject with priority weighting
    const basePeriodsPerSubject = Math.floor(totalSlots / subjects.length);
    const extraPeriods = totalSlots % subjects.length;
    
    // Create allocation plan
    const allocationPlan = [];
    
    subjects.forEach((subject, index) => {
        let periodsForSubject = basePeriodsPerSubject;
        
        // Give extra periods to high priority subjects first
        if (subject.priority === 'High' && highPrioritySubjects.indexOf(subject) < extraPeriods) {
            periodsForSubject++;
        } else if (subject.priority === 'Medium' && highPrioritySubjects.length === 0 && mediumPrioritySubjects.indexOf(subject) < extraPeriods) {
            periodsForSubject++;
        } else if (subject.priority === 'Low' && highPrioritySubjects.length === 0 && mediumPrioritySubjects.length === 0 && lowPrioritySubjects.indexOf(subject) < extraPeriods) {
            periodsForSubject++;
        }
        
        console.log(`${subject.name} (${subject.priority}): ${periodsForSubject} periods`);
        
        // Add periods to allocation plan
        for (let i = 0; i < periodsForSubject; i++) {
            allocationPlan.push({
                subject: subject.name,
                subjectCode: subject.code,
                teacher: subject.teachers[i % subject.teachers.length],
                priority: subject.priority,
                isLab: subject.isLab || false
            });
        }
    });
    
    // Distribute subjects evenly across the week to avoid clustering
    distributeSubjectsEvenly(grid, allocationPlan, data, workingDays, maxHoursPerDay);
    
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
    
    // Create allocation plan for remaining days
    const allocationPlan = [];
    const basePeriodsPerSubject = Math.floor(totalSlots / subjects.length);
    const extraPeriods = totalSlots % subjects.length;
    
    // Separate subjects by priority
    const highPrioritySubjects = subjects.filter(s => s.priority === 'High');
    
    subjects.forEach((subject, index) => {
        let periodsForSubject = basePeriodsPerSubject;
        
        // Give extra periods to high priority subjects
        if (subject.priority === 'High' && highPrioritySubjects.indexOf(subject) < extraPeriods) {
            periodsForSubject++;
        }
        
        console.log(`${subject.name} (${subject.priority}): ${periodsForSubject} periods`);
        
        for (let i = 0; i < periodsForSubject; i++) {
            allocationPlan.push({
                subject: subject.name,
                subjectCode: subject.code,
                teacher: subject.teachers[i % subject.teachers.length],
                priority: subject.priority,
                isLab: subject.isLab || false
            });
        }
    });
    
    // Distribute subjects only on working days, avoiding free days
    distributeSubjectsOnWorkingDays(grid, allocationPlan, data, workingDays, maxHoursPerDay, freeDays);
    
    return {
        ...data,
        timetableGrid: grid
    };
}

// FUNCTION: Distribute subjects evenly across all days (freeLectures = 0)
function distributeSubjectsEvenly(grid, allocationPlan, data, workingDays, maxHoursPerDay) {
    console.log('\n=== DISTRIBUTING SUBJECTS EVENLY ACROSS WEEK ===');
    
    // Group allocations by subject for even distribution
    const subjectGroups = {};
    allocationPlan.forEach(allocation => {
        if (!subjectGroups[allocation.subject]) {
            subjectGroups[allocation.subject] = [];
        }
        subjectGroups[allocation.subject].push(allocation);
    });
    
    // Track daily allocation count to ensure even distribution
    const dailyCount = Array(workingDays).fill(0);
    const subjectDailyCount = {};
    
    // Initialize subject daily tracking
    Object.keys(subjectGroups).forEach(subject => {
        subjectDailyCount[subject] = Array(workingDays).fill(0);
    });
    
    // Allocate high priority subjects first, spreading them evenly
    const highPriorityAllocations = allocationPlan.filter(a => a.priority === 'High');
    allocateWithEvenDistribution(grid, highPriorityAllocations, data, workingDays, maxHoursPerDay, dailyCount, subjectDailyCount);
    
    // Then allocate medium and low priority subjects
    const otherAllocations = allocationPlan.filter(a => a.priority !== 'High');
    allocateWithEvenDistribution(grid, otherAllocations, data, workingDays, maxHoursPerDay, dailyCount, subjectDailyCount);
    
    console.log('Even distribution completed');
}

// FUNCTION: Distribute subjects only on working days (freeLectures > 0)
function distributeSubjectsOnWorkingDays(grid, allocationPlan, data, workingDays, maxHoursPerDay, freeDays) {
    console.log('\n=== DISTRIBUTING SUBJECTS ON WORKING DAYS ONLY ===');
    
    const workingDaysOnly = [];
    for (let day = 0; day < workingDays; day++) {
        if (!freeDays.includes(day)) {
            workingDaysOnly.push(day);
        }
    }
    
    let allocationIndex = 0;
    
    // Fill working days with subjects
    for (const day of workingDaysOnly) {
        for (let period = 0; period < maxHoursPerDay; period++) {
            // Skip break periods
            if (data.breakEnabled && period === data.breakStart) {
                grid[period][day] = {
                    subject: 'BREAK',
                    teacher: '',
                    subjectCode: '',
                    isBreak: true
                };
                continue;
            }
            
            // Allocate subject if available
            if (allocationIndex < allocationPlan.length) {
                const allocation = allocationPlan[allocationIndex];
                grid[period][day] = {
                    subject: allocation.subject,
                    subjectCode: allocation.subjectCode,
                    teacher: allocation.teacher,
                    isBreak: false
                };
                allocationIndex++;
            }
        }
    }
    
    console.log(`Allocated ${allocationIndex} subjects on working days`);
}

// FUNCTION: Allocate subjects with even distribution logic
function allocateWithEvenDistribution(grid, allocations, data, workingDays, maxHoursPerDay, dailyCount, subjectDailyCount) {
    // Sort allocations to prioritize high priority subjects
    allocations.sort((a, b) => {
        if (a.priority === 'High' && b.priority !== 'High') return -1;
        if (a.priority !== 'High' && b.priority === 'High') return 1;
        return 0;
    });
    
    for (const allocation of allocations) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = workingDays * maxHoursPerDay;
        
        while (!placed && attempts < maxAttempts) {
            // Find the day with the least allocations for even distribution
            let bestDay = 0;
            let minCount = dailyCount[0];
            
            for (let day = 1; day < workingDays; day++) {
                if (dailyCount[day] < minCount) {
                    minCount = dailyCount[day];
                    bestDay = day;
                }
            }
            
            // Try to place on the best day
            for (let period = 0; period < maxHoursPerDay; period++) {
                // Skip break periods
                if (data.breakEnabled && period === data.breakStart) {
                    continue;
                }
                
                // Check if slot is empty
                if (!grid[period][bestDay].subject) {
                    // Avoid placing same subject consecutively (unless it's a lab)
                    if (period > 0 && grid[period - 1][bestDay].subject === allocation.subject && !allocation.isLab) {
                        continue;
                    }
                    if (period < maxHoursPerDay - 1 && grid[period + 1][bestDay].subject === allocation.subject && !allocation.isLab) {
                        continue;
                    }
                    
                    // Place the subject
                    grid[period][bestDay] = {
                        subject: allocation.subject,
                        subjectCode: allocation.subjectCode,
                        teacher: allocation.teacher,
                        isBreak: false
                    };
                    
                    dailyCount[bestDay]++;
                    subjectDailyCount[allocation.subject][bestDay]++;
                    placed = true;
                    break;
                }
            }
            
            attempts++;
            if (!placed) {
                // If we couldn't place on the best day, try any day
                for (let day = 0; day < workingDays && !placed; day++) {
                    for (let period = 0; period < maxHoursPerDay && !placed; period++) {
                        if (data.breakEnabled && period === data.breakStart) continue;
                        
                        if (!grid[period][day].subject) {
                            grid[period][day] = {
                                subject: allocation.subject,
                                subjectCode: allocation.subjectCode,
                                teacher: allocation.teacher,
                                isBreak: false
                            };
                            dailyCount[day]++;
                            placed = true;
                        }
                    }
                }
            }
        }
        
        if (!placed) {
            console.warn(`Could not place ${allocation.subject}`);
        }
    }
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
