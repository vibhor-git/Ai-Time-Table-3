// Dashboard module for AI Timetable Generator

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    
    initializeDashboard();
    loadRecentActivity();
    setupEventListeners();
});

function initializeDashboard() {
    const user = getCurrentUser();
    if (user) {
        // Update user greeting
        const userGreeting = document.getElementById('user-greeting');
        if (userGreeting) {
            userGreeting.textContent = `Welcome, ${user.username}!`;
        }
    }

    // Add animation delays to cards
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

function setupEventListeners() {
    // Add click handlers for dashboard cards
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                return; // Let the actual link/button handle the click
            }
            
            const link = card.querySelector('a, button');
            if (link) {
                link.click();
            }
        });
    });
}

function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    const history = getFromStorage('aitt-history') || [];
    const subjects = getFromStorage('aitt-subjects-teachers') || [];
    
    // Combine and sort all activities
    const activities = [];
    
    // Add timetable history
    history.forEach(item => {
        activities.push({
            type: 'timetable',
            title: item.title,
            date: item.createdAt,
            icon: 'fas fa-calendar-alt',
            color: 'primary',
            data: item
        });
    });
    
    // Add recent subjects (simulate creation dates if not available)
    subjects.slice(0, 5).forEach(subject => {
        activities.push({
            type: 'subject',
            title: `Added ${subject.subjectName}`,
            date: subject.createdAt || new Date().toISOString(),
            icon: 'fas fa-book',
            color: 'success',
            data: subject
        });
    });
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take only recent 5 activities
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-clock fa-2x mb-3"></i>
                <p>No recent activity found.</p>
                <p>Start by creating a timetable or managing subjects.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group list-group-flush">';
    
    recentActivities.forEach((activity, index) => {
        const formatted = formatDateTime(activity.date);
        
        html += `
            <div class="list-group-item border-0 px-0 animate-slide-up" style="animation-delay: ${index * 0.1}s">
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0 me-3">
                        <div class="icon-circle bg-${activity.color}">
                            <i class="${activity.icon} text-white"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${activity.title}</h6>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>${formatted.full}
                        </small>
                    </div>
                    <div class="flex-shrink-0">
                        ${getActivityActionButton(activity)}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function getActivityActionButton(activity) {
    switch (activity.type) {
        case 'timetable':
            return `
                <button class="btn btn-outline-primary btn-sm" onclick="viewTimetableFromDashboard('${activity.data.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            `;
        case 'subject':
            return `
                <button class="btn btn-outline-success btn-sm" onclick="window.location.href='/manage'">
                    <i class="fas fa-edit"></i>
                </button>
            `;
        default:
            return '';
    }
}

function viewTimetableFromDashboard(id) {
    // Redirect to history page with specific timetable
    window.location.href = `/history?view=${id}`;
}

function exportLatest(format) {
    const history = getFromStorage('aitt-history') || [];
    
    if (history.length === 0) {
        showToast('No timetables found to export', 'warning');
        return;
    }
    
    // Get the latest timetable
    const latest = history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    exportTimetableData(latest.data, format);
}

function showStats() {
    const modal = new bootstrap.Modal(document.getElementById('statsModal'));
    generateStatistics();
    modal.show();
}

function generateStatistics() {
    const container = document.getElementById('stats-content');
    if (!container) return;
    
    const history = getFromStorage('aitt-history') || [];
    const subjects = getFromStorage('aitt-subjects-teachers') || [];
    const users = getFromStorage('aitt-users') || [];
    
    // Calculate statistics
    const stats = {
        totalTimetables: history.length,
        totalSubjects: subjects.length,
        totalTeachers: [...new Set(subjects.flatMap(s => s.teacherNames || []))].length,
        totalUsers: users.length,
        coursesManaged: [...new Set(subjects.map(s => s.courseName).filter(Boolean))].length,
        classesManaged: [...new Set(subjects.map(s => s.className).filter(Boolean))].length
    };
    
    // Recent activity stats
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const weeklyTimetables = history.filter(h => new Date(h.createdAt) >= thisWeek).length;
    const monthlyTimetables = history.filter(h => new Date(h.createdAt) >= thisMonth).length;
    
    // Most used courses and subjects
    const courseUsage = {};
    const subjectUsage = {};
    
    history.forEach(h => {
        const course = h.data.courseName;
        if (course) {
            courseUsage[course] = (courseUsage[course] || 0) + 1;
        }
    });
    
    subjects.forEach(s => {
        const subject = s.subjectName;
        if (subject) {
            subjectUsage[subject] = (subjectUsage[subject] || 0) + 1;
        }
    });
    
    const topCourse = Object.keys(courseUsage).sort((a, b) => courseUsage[b] - courseUsage[a])[0];
    const topSubject = Object.keys(subjectUsage).sort((a, b) => subjectUsage[b] - subjectUsage[a])[0];
    
    // Generate HTML
    container.innerHTML = `
        <div class="row g-4">
            <div class="col-md-6">
                <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                        <i class="fas fa-calendar-alt fa-2x mb-3"></i>
                        <h3 class="mb-1">${stats.totalTimetables}</h3>
                        <p class="mb-0">Total Timetables</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card bg-success text-white">
                    <div class="card-body text-center">
                        <i class="fas fa-book fa-2x mb-3"></i>
                        <h3 class="mb-1">${stats.totalSubjects}</h3>
                        <p class="mb-0">Total Subjects</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card bg-info text-white">
                    <div class="card-body text-center">
                        <i class="fas fa-chalkboard-teacher fa-2x mb-3"></i>
                        <h3 class="mb-1">${stats.totalTeachers}</h3>
                        <p class="mb-0">Total Teachers</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card bg-warning text-dark">
                    <div class="card-body text-center">
                        <i class="fas fa-graduation-cap fa-2x mb-3"></i>
                        <h3 class="mb-1">${stats.coursesManaged}</h3>
                        <p class="mb-0">Courses Managed</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <h5><i class="fas fa-chart-line me-2"></i>Activity Overview</h5>
                <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        This Week
                        <span class="badge bg-primary rounded-pill">${weeklyTimetables}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        This Month
                        <span class="badge bg-success rounded-pill">${monthlyTimetables}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Total Classes
                        <span class="badge bg-info rounded-pill">${stats.classesManaged}</span>
                    </li>
                </ul>
            </div>
            <div class="col-md-6">
                <h5><i class="fas fa-star me-2"></i>Top Usage</h5>
                <ul class="list-group">
                    <li class="list-group-item">
                        <strong>Most Used Course:</strong><br>
                        <span class="text-muted">${topCourse || 'N/A'}</span>
                    </li>
                    <li class="list-group-item">
                        <strong>Most Added Subject:</strong><br>
                        <span class="text-muted">${topSubject || 'N/A'}</span>
                    </li>
                </ul>
            </div>
        </div>
        
        ${stats.totalTimetables === 0 ? `
            <div class="alert alert-info mt-4">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Get Started:</strong> Create your first timetable to see more detailed statistics.
            </div>
        ` : ''}
    `;
}

// Quick actions from dashboard
function quickCreateTimetable(type) {
    window.location.href = type === 'course' ? '/timetable/course' : '/timetable/class';
}

function quickManageSubjects() {
    window.location.href = '/manage';
}

function quickViewHistory() {
    window.location.href = '/history';
}

// Dashboard refresh functionality
function refreshDashboard() {
    showToast('Refreshing dashboard...', 'info');
    
    setTimeout(() => {
        loadRecentActivity();
        showToast('Dashboard refreshed successfully!', 'success');
    }, 1000);
}

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+R or F5 to refresh dashboard
        if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
            e.preventDefault();
            refreshDashboard();
        }
        
        // Quick navigation shortcuts
        if (e.ctrlKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    window.location.href = '/timetable/course';
                    break;
                case '2':
                    e.preventDefault();
                    window.location.href = '/timetable/class';
                    break;
                case '3':
                    e.preventDefault();
                    window.location.href = '/manage';
                    break;
                case '4':
                    e.preventDefault();
                    window.location.href = '/history';
                    break;
            }
        }
    });
});

// Export dashboard functions
window.DashboardModule = {
    loadRecentActivity,
    showStats,
    exportLatest,
    refreshDashboard,
    quickCreateTimetable,
    quickManageSubjects,
    quickViewHistory
};
