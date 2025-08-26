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
    
    // Create allocation plan with lab duration support
    const allocationPlan = [];
    const totalSlots = workingDays * maxHoursPerDay;
    const slotsPerSubject = Math.floor(totalSlots / subjects.length);
    
    // For single timetables, create consistent allocation plan
    subjects.forEach(subject => {
        const teacher = subject.teachers[0]; // Use first teacher
        const isDoubleLab = subject.isLab && subject.labDuration === 'double';
        
        if (isDoubleLab) {
            // For double duration labs, create half the sessions but each takes 2 slots
            const labSessions = Math.floor(slotsPerSubject / 2);
            console.log(`Single Timetable: ${subject.name} = ${labSessions} double-lab sessions (${labSessions * 2} total periods)`);
            for (let i = 0; i < labSessions; i++) {
                allocationPlan.push({
                    subject: subject.name,
                    teacher: teacher,
                    subjectCode: subject.code,
                    isLab: true,
                    isDouble: true,
                    labDuration: 'double'
                });
            }
        } else {
            // Regular subjects or single-period labs
            console.log(`Single Timetable: ${subject.name} = ${slotsPerSubject} ${subject.isLab ? 'single-lab' : 'theory'} sessions`);
            for (let i = 0; i < slotsPerSubject; i++) {
                allocationPlan.push({
                    subject: subject.name,
                    teacher: teacher,
                    subjectCode: subject.code,
                    isLab: subject.isLab || false,
                    isDouble: false,
                    labDuration: subject.labDuration || 'regular'
                });
            }
        }
    });
    
    // Allocate subjects with lab support
    let currentDay = 0;
    let currentPeriod = 0;
    
    for (const allocation of allocationPlan) {
        let allocated = false;
        let attempts = 0;
        const maxAttempts = totalSlots;
        
        while (!allocated && attempts < maxAttempts) {
            if (allocation.isDouble) {
                // Need 2 consecutive periods for double lab (avoid breaks)
                if (currentPeriod < maxHoursPerDay - 1 && 
                    !grid[currentPeriod][currentDay].subject && 
                    !grid[currentPeriod + 1][currentDay].subject) {
                    
                    // Skip if break would be between the two periods
                    if (data.breakEnabled && 
                        (currentPeriod === data.breakStart - 1 || currentPeriod + 1 === data.breakStart)) {
                        // Skip this slot, continue searching
                    } else {
                        // Allocate double lab
                        grid[currentPeriod][currentDay] = {
                            subject: allocation.subject,
                            teacher: allocation.teacher,
                            subjectCode: allocation.subjectCode,
                            isBreak: false,
                            isLab: true,
                            labPart: 1,
                            labDuration: 'double'
                        };
                        
                        grid[currentPeriod + 1][currentDay] = {
                            subject: allocation.subject,
                            teacher: allocation.teacher,
                            subjectCode: allocation.subjectCode,
                            isBreak: false,
                            isLab: true,
                            labPart: 2,
                            labDuration: 'double'
                        };
                        
                        allocated = true;
                        console.log(`Allocated DOUBLE LAB: ${allocation.subject} on Day ${currentDay+1} Period ${currentPeriod+1}-${currentPeriod+2}`);
                    }
                }
            } else {
                // Regular allocation
                if (!grid[currentPeriod][currentDay].subject) {
                    grid[currentPeriod][currentDay] = {
                        subject: allocation.subject,
                        teacher: allocation.teacher,
                        subjectCode: allocation.subjectCode,
                        isBreak: false,
                        isLab: allocation.isLab,
                        labDuration: allocation.labDuration
                    };
                    allocated = true;
                }
            }
            
            // Move to next slot
            currentPeriod++;
            if (currentPeriod >= maxHoursPerDay) {
                currentPeriod = 0;
                currentDay++;
                if (currentDay >= workingDays) {
                    currentDay = 0;
                }
            }
            
            attempts++;
        }
        
        if (!allocated) {
            console.warn(`Could not allocate ${allocation.subject} (${allocation.isDouble ? 'Double Lab' : 'Regular'})`);
        }
    }
    
    // Fill remaining slots with free periods
    for (let period = 0; period < maxHoursPerDay; period++) {
        for (let day = 0; day < workingDays; day++) {
            if (!grid[period][day].subject) {
                grid[period][day] = {
                    subject: 'Free',
                    teacher: '',
                    subjectCode: '',
                    isBreak: false
                };
            }
        }
    }
    
    return {
        ...data,
        timetableGrid: grid
    };
}

// Conflict-free timetable generation that respects global teacher schedule
function generateConflictFreeTimetable(data) {
    const { workingDays, maxHoursPerDay, subjects, globalTeacherSchedule } = data;
    
    // Initialize grid
    const grid = [];
    for (let period = 0; period < maxHoursPerDay; period++) {
        const row = [];
        for (let day = 0; day < workingDays; day++) {
            row.push({ subject: null, teacher: null, subjectCode: null, isBreak: false });
        }
        grid.push(row);
    }
    
    // Create allocation plan for this section
    const allocationPlan = [];
    const totalSlots = workingDays * maxHoursPerDay;
    const slotsPerSubject = Math.floor(totalSlots / subjects.length);
    
    console.log(`Section ${data.sectionNumber || 1} Allocation Details:`);
    console.log(`  Total slots available: ${totalSlots}`);
    console.log(`  Slots per subject: ${slotsPerSubject}`);
    console.log(`  Number of subjects: ${subjects.length}`);
    
    // Calculate fixed allocation based on total lectures for consistent distribution
    const totalLectures = subjects.reduce((sum, subject) => {
        return sum + (subject.isLab && subject.labDuration === 'double' ? 
            Math.floor(slotsPerSubject / 2) * 2 : // Double labs take 2 slots each
            slotsPerSubject); // Regular subjects take 1 slot each
    }, 0);
    
    // Use the pre-created master allocation plan (should already exist for multiple sections)
    if (!data.globalAllocationPlan) {
        console.warn(`No global allocation plan found for section ${data.sectionNumber}, creating one...`);
        // Fallback: create allocation plan for single section
        data.globalAllocationPlan = {};
        subjects.forEach(subject => {
            const isDoubleLab = subject.isLab && subject.labDuration === 'double';
            
            if (isDoubleLab) {
                const labSessions = Math.floor(slotsPerSubject / 2);
                data.globalAllocationPlan[subject.name] = {
                    type: 'doubleLab',
                    sessions: labSessions,
                    isLab: true,
                    labDuration: 'double'
                };
                console.log(`Fallback Plan: ${subject.name} = ${labSessions} double-lab sessions (${labSessions * 2} total periods)`);
            } else {
                data.globalAllocationPlan[subject.name] = {
                    type: 'regular',
                    sessions: slotsPerSubject,
                    isLab: subject.isLab || false,
                    labDuration: subject.labDuration || 'regular'
                };
                console.log(`Fallback Plan: ${subject.name} = ${slotsPerSubject} ${subject.isLab ? 'single-lab' : 'theory'} sessions`);
            }
        });
    } else {
        console.log(`Section ${data.sectionNumber}: Using existing master allocation plan`);
    }
    
    // Apply the global allocation plan to this section
    subjects.forEach(subject => {
        const teacher = subject.teachers[0]; // Use assigned teacher for this section
        const allocation = data.globalAllocationPlan[subject.name];
        
        if (!allocation) {
            console.error(`No allocation plan found for ${subject.name}`);
            return;
        }
        
        console.log(`Section ${data.sectionNumber}: Using global plan for ${subject.name} - ${allocation.sessions} ${allocation.type} sessions`);
        
        if (allocation.type === 'doubleLab') {
            // Add double lab sessions - exactly the same number for all sections
            for (let i = 0; i < allocation.sessions; i++) {
                allocationPlan.push({
                    subject: subject.name,
                    teacher: teacher,
                    subjectCode: subject.code,
                    isLab: true,
                    isDouble: true,
                    labDuration: 'double'
                });
                console.log(`Section ${data.sectionNumber}: Added double lab ${i+1}/${allocation.sessions} for ${subject.name}`);
            }
        } else {
            // Add regular sessions - exactly the same number for all sections
            for (let i = 0; i < allocation.sessions; i++) {
                allocationPlan.push({
                    subject: subject.name,
                    teacher: teacher,
                    subjectCode: subject.code,
                    isLab: allocation.isLab,
                    isDouble: false,
                    labDuration: allocation.labDuration
                });
                if (allocation.isLab) {
                    console.log(`Section ${data.sectionNumber}: Added single lab ${i+1}/${allocation.sessions} for ${subject.name}`);
                }
            }
        }
    });
    
    console.log(`Section ${data.sectionNumber}: Total allocation plan has ${allocationPlan.length} items`);
    
    // Debug: Count labs in this section's allocation
    const labCount = allocationPlan.filter(item => item.isLab).length;
    const doubleLabCount = allocationPlan.filter(item => item.isDouble).length;
    console.log(`Section ${data.sectionNumber}: Labs in allocation - Single: ${labCount - doubleLabCount}, Double: ${doubleLabCount}, Total Lab Periods: ${(labCount - doubleLabCount) + (doubleLabCount * 2)}`);
    
    // Shuffle allocation plan to distribute subjects randomly
    for (let i = allocationPlan.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allocationPlan[i], allocationPlan[j]] = [allocationPlan[j], allocationPlan[i]];
    }
    
    // Allocate subjects with conflict checking
    for (const allocation of allocationPlan) {
        let allocated = false;
        
        if (allocation.isDouble) {
            // Handle double duration labs - need 2 consecutive periods (NO BREAKS BETWEEN)
            for (let attempt = 0; attempt < totalSlots && !allocated; attempt++) {
                const day = Math.floor(Math.random() * workingDays);
                
                // Try all possible consecutive period pairs on this day
                for (let period = 0; period < maxHoursPerDay - 1 && !allocated; period++) {
                    // Skip break periods entirely for lab allocation
                    if (data.breakEnabled && (period === data.breakStart || period + 1 === data.breakStart)) {
                        continue;
                    }
                    
                    // Check if both consecutive slots are empty
                    if (grid[period][day].subject || grid[period + 1][day].subject) {
                        continue;
                    }
                    
                    // Check if teacher is available for both consecutive periods
                    const teacherKey1 = `${allocation.teacher}_${day}_${period}`;
                    const teacherKey2 = `${allocation.teacher}_${day}_${period + 1}`;
                    if (globalTeacherSchedule[teacherKey1] || globalTeacherSchedule[teacherKey2]) {
                        continue;
                    }
                    
                    // Allocate both consecutive slots for the lab
                    grid[period][day] = {
                        subject: allocation.subject,
                        teacher: allocation.teacher,
                        subjectCode: allocation.subjectCode,
                        isBreak: false,
                        isLab: true,
                        labPart: 1,
                        labDuration: 'double'
                    };
                    
                    grid[period + 1][day] = {
                        subject: allocation.subject,
                        teacher: allocation.teacher,
                        subjectCode: allocation.subjectCode,
                        isBreak: false,
                        isLab: true,
                        labPart: 2,
                        labDuration: 'double'
                    };
                    
                    // Mark teacher as busy for both periods globally
                    globalTeacherSchedule[teacherKey1] = true;
                    globalTeacherSchedule[teacherKey2] = true;
                    allocated = true;
                    
                    console.log(`Section ${data.sectionNumber}: ${allocation.teacher} allocated DOUBLE LAB to Day ${day+1} Period ${period+1}-${period+2} for ${allocation.subject}`);
                }
            }
        } else {
            // Handle regular subjects or single-period labs
            for (let attempt = 0; attempt < totalSlots && !allocated; attempt++) {
                const day = Math.floor(Math.random() * workingDays);
                const period = Math.floor(Math.random() * maxHoursPerDay);
                
                // Check if slot is empty
                if (grid[period][day].subject) {
                    continue;
                }
                
                // Check if teacher is available at this time across all sections
                const teacherKey = `${allocation.teacher}_${day}_${period}`;
                if (globalTeacherSchedule[teacherKey]) {
                    continue; // Teacher is busy at this time
                }
                
                // Allocate the slot
                grid[period][day] = {
                    subject: allocation.subject,
                    teacher: allocation.teacher,
                    subjectCode: allocation.subjectCode,
                    isBreak: false,
                    isLab: allocation.isLab,
                    labDuration: allocation.labDuration
                };
                
                // Mark teacher as busy at this time globally
                globalTeacherSchedule[teacherKey] = true;
                allocated = true;
                
                const labInfo = allocation.isLab ? ' (Lab)' : '';
                console.log(`Section ${data.sectionNumber}: ${allocation.teacher} allocated to Day ${day+1} Period ${period+1} for ${allocation.subject}${labInfo}`);
            }
        }
        
        if (!allocated) {
            const labInfo = allocation.isDouble ? ' (Double Lab)' : allocation.isLab ? ' (Lab)' : '';
            console.warn(`Could not allocate ${allocation.subject}${labInfo} for ${allocation.teacher} in section ${data.sectionNumber} due to conflicts`);
        }
    }
    
    // Fill remaining slots with free periods
    for (let period = 0; period < maxHoursPerDay; period++) {
        for (let day = 0; day < workingDays; day++) {
            if (!grid[period][day].subject) {
                grid[period][day] = {
                    subject: 'Free',
                    teacher: '',
                    subjectCode: '',
                    isBreak: false
                };
            }
        }
    }
    
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
    
    // Fill remaining slots with "Free"
    for (let period = 0; period < maxHoursPerDay; period++) {
        for (let day = 0; day < workingDays; day++) {
            if (!grid[period][day].subject) {
                grid[period][day] = {
                    subject: 'Free',
                    teacher: '',
                    subjectCode: '',
                    isBreak: false
                };
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
    
    // Fill remaining available slots with "OFF" - but only up to maxHoursPerDay per day
    for (let day = 0; day < workingDays; day++) {
        for (let period = 0; period < maxHoursPerDay; period++) {
            if (!grid[period][day].subject) {
                grid[period][day] = {
                    subject: 'OFF',
                    teacher: '',
                    subjectCode: '',
                    isBreak: false
                };
            }
        }
    }
    
    return true;
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
            } else if (cell.subject === 'Free' || !cell.subject) {
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
