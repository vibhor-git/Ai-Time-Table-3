# AI TIMETABLE GENERATOR - LOCAL SETUP GUIDE

## OVERVIEW
This is a Flask-based web application for educational institutions to create, manage, and export automated timetables. The system generates course-wise and class/section-wise schedules with advanced features like teacher conflict resolution, lab scheduling, and PDF/Excel export.

## SYSTEM REQUIREMENTS
- Python 3.8 or higher
- pip (Python package installer)
- Web browser (Chrome, Firefox, Safari, or Edge)

## INSTALLATION STEPS

### Step 1: Download/Clone the Project
- Download the project files to your local machine
- Extract to a folder (e.g., "ai-timetable-generator")

### Step 2: Install Python Dependencies
Open terminal/command prompt in the project folder and run:

```
pip install flask flask-cors flask-sqlalchemy gunicorn openpyxl psycopg2-binary reportlab email-validator
```

Or if you have a requirements.txt file:
```
pip install -r requirements.txt
```

### Step 3: Set Environment Variables (Optional)
For better security, set these environment variables:
- SESSION_SECRET: A random secret key for sessions
- DATABASE_URL: Database connection string (optional, uses SQLite by default)

On Windows:
```
set SESSION_SECRET=your-secret-key-here
```

On Mac/Linux:
```
export SESSION_SECRET=your-secret-key-here
```

## RUNNING THE APPLICATION

### Method 1: Using Python directly
```
python main.py
```

### Method 2: Using Gunicorn (Recommended)
```
gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
```

### Method 3: Using Flask development server
```
flask run --host=0.0.0.0 --port=5000
```

## ACCESSING THE APPLICATION

1. Open your web browser
2. Navigate to: http://localhost:5000
3. You should see the AI Timetable Generator homepage

## USING THE APPLICATION

### Initial Setup:
1. Click "Get Started" on the homepage
2. Choose between "Single Section" or "Multiple Sections"
3. Fill in the basic information:
   - Class Name (e.g., "Computer Science - Year 3")
   - Number of working days (1-7)
   - Maximum hours per day (1-12)
   - Start time (e.g., 9:00 AM)
   - Lecture duration in minutes (e.g., 60)

### Adding Subjects:
1. Click "Add Subject" to add each subject
2. Fill in:
   - Subject Name (e.g., "Database Management")
   - Subject Code (e.g., "CS301")
   - Priority (High/Medium/Low)
   - Teachers (add multiple if available)
   - Check "Lab Subject" if it's a lab
   - Select lab duration (Regular/Double) for lab subjects

### Break Configuration:
1. Enable breaks if needed
2. Set break start period (e.g., period 3 for 11:00 AM break)
3. Set break duration in minutes

### Free Lectures Setting:
- Set to 0: All periods filled with subjects
- Set to number > 0: That many completely free days will be created

### Generate Timetable:
1. Click "Generate Timetable"
2. View the generated schedule
3. Export to PDF or Excel if needed

## FEATURES

### Core Features:
- Single and multiple section timetable generation
- Teacher conflict prevention across sections
- Lab duration handling (single/double periods)
- Priority-based subject allocation
- No consecutive same theory subjects
- Free lecture management
- Break period scheduling

### Export Options:
- PDF export with professional formatting
- Excel export with detailed scheduling
- Print-friendly layouts

### Advanced Features:
- Teacher workload distribution
- Lab session optimization
- Conflict-free scheduling across multiple sections
- Equal lab distribution across sections
- High-priority subject emphasis

## TROUBLESHOOTING

### Common Issues:

1. **Port already in use error:**
   - Change port number: `--port=5001`
   - Or kill existing process on port 5000

2. **Module not found errors:**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python version: `python --version`

3. **Permission denied errors:**
   - Run with administrator/sudo privileges
   - Check file permissions in project folder

4. **Browser shows "This site can't be reached":**
   - Ensure the application is running
   - Check if port 5000 is accessible
   - Try http://127.0.0.1:5000 instead

5. **Timetable generation fails:**
   - Check browser console for JavaScript errors
   - Ensure all required fields are filled
   - Try with fewer subjects initially

### Performance Tips:
- For better performance with large datasets, use fewer sections initially
- Lab subjects with double duration may take longer to allocate
- High-priority subjects get preference in allocation

## FILE STRUCTURE
```
ai-timetable-generator/
├── main.py              # Application entry point
├── app.py               # Flask application setup
├── static/
│   ├── css/
│   │   └── style.css    # Application styling
│   └── js/
│       └── generator.js # Timetable generation logic
├── templates/
│   ├── index.html       # Homepage
│   ├── dashboard.html   # Main application interface
│   └── base.html        # Base template
└── readme.txt           # This file
```

## SUPPORT
For issues or questions:
1. Check the browser console for error messages
2. Verify all form fields are properly filled
3. Ensure stable internet connection for CSS/JS libraries
4. Try refreshing the page if generation fails

## TECHNICAL NOTES
- Built with Flask (Python web framework)
- Frontend uses Bootstrap 5 for responsive design
- Client-side storage for timetable data
- PDF generation using ReportLab
- Excel export using OpenPyXL
- No database required for basic functionality

Enjoy using the AI Timetable Generator!