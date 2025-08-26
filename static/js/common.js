// Common utility functions and global configurations

// Storage utilities
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// Session management
function getCurrentUser() {
    const session = getFromStorage('aitt-session');
    if (session && session.userId) {
        const users = getFromStorage('aitt-users') || [];
        return users.find(user => user.id === session.userId);
    }
    return null;
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function logout() {
    removeFromStorage('aitt-session');
    window.location.href = '/';
}

// Check authentication on protected pages
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Generate unique ID
function generateId() {
    return 'aitt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        full: date.toLocaleString()
    };
}

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `
        <div class="d-flex align-items-center p-3">
            <div class="me-2">
                ${getToastIcon(type)}
            </div>
            <div class="flex-grow-1">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white ms-2" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };
    return icons[type] || icons.info;
}

// Form validation utilities
function validateForm(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
}

function resetForm(form) {
    form.reset();
    form.classList.remove('was-validated');
}

// Loading state management
function setLoadingState(button, loading = true) {
    if (loading) {
        button.disabled = true;
        button.innerHTML = button.innerHTML.replace(/(<i[^>]*><\/i>\s*)/g, '') + ' <span class="loading-spinner"></span>';
    } else {
        button.disabled = false;
        button.innerHTML = button.innerHTML.replace(/\s*<span class="loading-spinner"><\/span>/g, '');
    }
}

// Export utilities
function exportTimetableData(data, format) {
    const endpoint = format === 'pdf' ? '/export/pdf' : '/export/excel';
    
    // Show loading state
    const exportButtons = document.querySelectorAll(`[onclick*="export"][onclick*="${format}"]`);
    exportButtons.forEach(btn => setLoadingState(btn, true));

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Export failed');
        }
        return response.blob();
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetable_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        showToast(`Timetable exported as ${format.toUpperCase()} successfully!`, 'success');
    })
    .catch(error => {
        console.error('Export error:', error);
        showToast('Failed to export timetable. Please try again.', 'error');
    })
    .finally(() => {
        // Remove loading state
        exportButtons.forEach(btn => setLoadingState(btn, false));
    });
}

// Timetable HTML generation
function generateTimetableHTML(data) {
    const { timetableGrid, workingDays, maxHoursPerDay } = data;
    
    if (!timetableGrid || timetableGrid.length === 0) {
        return '<div class="text-center text-muted py-4">No timetable data available</div>';
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const displayDays = days.slice(0, workingDays);

    let html = `
        <div class="timetable-container">
            <table class="table table-bordered timetable-table mb-0">
                <thead>
                    <tr>
                        <th style="min-width: 120px;">Time</th>
    `;

    displayDays.forEach(day => {
        html += `<th style="min-width: 150px;">${day}</th>`;
    });

    html += `
                    </tr>
                </thead>
                <tbody>
    `;

    timetableGrid.forEach((row, periodIndex) => {
        html += `<tr><td class="fw-bold">Period ${periodIndex + 1}</td>`;
        
        row.slice(0, workingDays).forEach(cell => {
            let cellClass = 'timetable-cell';
            let cellContent = '';
            
            if (cell.isBreak) {
                cellClass += ' break-cell';
                cellContent = '<div class="fw-bold">BREAK</div>';
            } else if (cell.subject) {
                cellClass += ' subject-cell';
                cellContent = `
                    <div class="subject-name">${cell.subject}</div>
                    <div class="teacher-name">${cell.teacher || 'TBA'}</div>
                `;
            } else {
                cellClass += ' free-cell';
                cellContent = '<div class="fw-bold">Free</div>';
            }
            
            html += `<td><div class="${cellClass}">${cellContent}</div></td>`;
        });
        
        html += '</tr>';
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    return html;
}

// Subject management utilities
function getSubjectsFromStorage() {
    return getFromStorage('aitt-subjects-teachers') || [];
}

function saveSubjectsToStorage(subjects) {
    return saveToStorage('aitt-subjects-teachers', subjects);
}

// History management utilities
function saveTimetableToHistory(title, data) {
    const history = getFromStorage('aitt-history') || [];
    const newEntry = {
        id: generateId(),
        title: title,
        createdAt: new Date().toISOString(),
        data: data
    };
    
    history.push(newEntry);
    return saveToStorage('aitt-history', history);
}

// Initialize common features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a protected page and require authentication
    const protectedPages = ['/dashboard', '/timetable', '/manage', '/history'];
    const currentPath = window.location.pathname;
    
    if (protectedPages.some(page => currentPath.includes(page))) {
        if (!requireAuth()) {
            return;
        }
        
        // Update user greeting if element exists
        const userGreeting = document.getElementById('user-greeting');
        if (userGreeting) {
            const user = getCurrentUser();
            if (user) {
                userGreeting.textContent = `Welcome, ${user.username}!`;
            }
        }
    }

    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add loading states to forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton && validateForm(form)) {
                setLoadingState(submitButton, true);
                
                // Reset loading state after a delay (for better UX)
                setTimeout(() => {
                    setLoadingState(submitButton, false);
                }, 2000);
            }
        });
    });

    // Add hover effects to cards
    document.querySelectorAll('.card, .dashboard-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('An unexpected error occurred. Please try again.', 'error');
});

// Export common utilities for use in other modules
window.CommonUtils = {
    saveToStorage,
    getFromStorage,
    removeFromStorage,
    getCurrentUser,
    isLoggedIn,
    logout,
    generateId,
    formatDateTime,
    showToast,
    validateForm,
    resetForm,
    setLoadingState,
    exportTimetableData,
    generateTimetableHTML,
    getSubjectsFromStorage,
    saveSubjectsToStorage,
    saveTimetableToHistory
};
