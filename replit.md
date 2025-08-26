# Overview

AI Timetable Generator is a Flask-based web application designed for educational institutions to create, manage, and export automated timetables. The system provides an intuitive interface for colleges and schools to generate course-wise and class/section-wise schedules, manage subjects and teachers, and export timetables in PDF and Excel formats. The application emphasizes user experience with responsive design, smooth animations, and comprehensive timetable management capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a traditional server-rendered architecture with Flask serving HTML templates enhanced by client-side JavaScript. The frontend employs Bootstrap 5 for responsive design and Font Awesome for iconography. CSS animations and JavaScript modules provide interactive features including form validation, dynamic content loading, and smooth transitions between states.

## Backend Architecture
Built on Flask with a lightweight MVC pattern where routes handle HTTP requests and render appropriate templates. The application uses Python's ReportLab library for PDF generation and OpenPyXL for Excel export functionality. The backend implements a stateless design with no database persistence, relying entirely on client-side storage for data management.

## Data Storage Solution
The system uses browser LocalStorage as the primary data persistence layer, storing user credentials, timetable configurations, subject/teacher data, and generated timetables. This approach eliminates server-side database requirements but limits data portability across devices. Data is structured as JSON objects with separate storage keys for different entity types (users, sessions, subjects, history).

## Authentication and Authorization
Implements a simple client-side authentication system using LocalStorage to maintain user sessions. The authentication flow includes signup/login forms with validation, session management through stored user tokens, and route protection requiring authentication for dashboard access. No server-side session management or password encryption is implemented.

## Timetable Generation Logic
The core algorithm generates timetables by processing user inputs (working days, subjects, teachers, time slots) and creating structured schedules. The system supports both course-wise and class/section-wise generation modes with configurable parameters including break periods, daily working hours, and subject-teacher assignments.

# External Dependencies

## Frontend Libraries
- **Bootstrap 5.3.0**: Provides responsive grid system, component styling, and mobile-first design patterns
- **Font Awesome 6.0.0**: Icon library for consistent visual elements across the interface
- **Custom CSS/JavaScript**: Application-specific styling and functionality modules

## Backend Python Libraries
- **Flask**: Web framework handling routing, templating, and HTTP request processing
- **Flask-CORS**: Enables cross-origin requests for API endpoints
- **ReportLab**: PDF generation library for creating formatted timetable documents with tables, styling, and layout control
- **OpenPyXL**: Excel file manipulation library for generating .xlsx format timetables with formatting, styling, and data organization

## Browser APIs
- **LocalStorage**: Primary data persistence mechanism for storing user data, application state, and generated timetables
- **File Download API**: Enables client-side file downloads for exported PDF and Excel documents

## Development Dependencies
- **Python Logging**: Application monitoring and debugging capabilities
- **Tempfile**: Temporary file management for export operations
- **UUID**: Unique identifier generation for data records and session management