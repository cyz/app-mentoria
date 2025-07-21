---
applyTo: '**'
---
# Custom Instructions for WoMakersCode Mentorship Project

## Project Overview

This is a **FastAPI-based mentorship management system** for WoMakersCode's soft skills mentorship program. The application manages user profiles (coordinators and students), mentorship activities, and enrollment processes through a modern web interface.

## Architecture & Technology Stack

### Backend (Python/FastAPI)

- **Main API**: `src/app.py` - FastAPI application with REST endpoints
- **Data Layer**: `src/data_manager.py` - JSON-based data persistence with caching
- **Models**: Data validation models for request/response validation
- **Authentication**: Profile-based role system (coordinator/student)

### Frontend (Vanilla JavaScript)

- **Main Interface**: `src/static/index.html` - Single-page dashboard with Tailwind CSS
- **Core Logic**: `src/static/app.js` - ES6 class-based `MentorshipDashboard`
- **Styling**: Tailwind CSS with custom component styling

### Data Storage

- **Activities**: `src/data/activities.json` - Mentorship sessions with participants
- **Users**: `src/data/users.json` - User profiles and permissions

## Key Features & Patterns

### 1. Role-Based Access Control

```json
"profiles": {
    "coordinator": {
        "permissions": ["create", "read", "update", "delete", "manage_activities", "manage_participants"]
    },
    "participant": {
        "permissions": ["read", "self_manage"]
    }
}
```

### 2. API Endpoints Pattern

- `GET /activities` - List all mentorship activities
- `POST /activities/{name}/register` - Enroll participant
- `DELETE /activities/{name}/cancel` - Cancel enrollment
- `POST /activities` - Create new mentorship (coordinators only)
- `DELETE /activities/{name}` - Delete mentorship (coordinators only)

### 3. Frontend Architecture

- **Class-based**: Single `MentorshipDashboard` class manages all functionality
- **Event-driven**: DOM event listeners for user interactions
- **Async/await**: Modern JavaScript for API communication
- **Responsive**: Mobile-first design with Tailwind CSS

## Development Guidelines

### 1. Code Style & Standards

- **Python**: Follow PEP 8, use type hints, async/await for I/O operations
- **JavaScript**: ES6+ features, camelCase naming, async/await for fetch calls
- **HTML**: Semantic markup, Tailwind utility classes, accessibility considerations

### 2. Data Handling

- **Cache Management**: DataManager class handles JSON file caching and refresh
- **Validation**: Data validation models validate all API inputs
- **Error Handling**: Comprehensive try-catch blocks with user-friendly messages

### 3. UI/UX Patterns

- **Modals**: Dynamic content loading for activity details and forms
- **Toast Notifications**: Success/error feedback with auto-dismiss
- **Permission-based UI**: Hide/show features based on user permissions
- **Real-time Updates**: Automatic data refresh after operations

### 4. Security & Validation

- **Input Sanitization**: URL encoding for activity names and emails
- **Permission Checks**: Backend validation for all operations
- **Conflict Prevention**: Check for scheduling conflicts and capacity limits

## Common Tasks & Implementation Patterns

### Adding New API Endpoints

1. Define data validation models for request/response
2. Add permission checks in endpoint
3. Implement data validation and business logic
4. Update DataManager methods if needed
5. Add error handling with appropriate HTTP status codes

### Frontend Feature Development

1. Add UI elements to `index.html` with Tailwind classes
2. Implement JavaScript methods in `MentorshipDashboard` class
3. Add event listeners in `bindEvents()` method
4. Handle API communication with fetch and async/await
5. Update UI state and show user feedback

### Data Model Changes

1. Update JSON structure in data files
2. Modify DataManager methods for data access
3. Update data validation models for validation
4. Test data migration if needed
5. Update frontend to handle new data structure

## Testing & Debugging

### Development Environment

- **Dev Container**: Pre-configured Python 3.13 with all dependencies
- **VS Code**: Integrated debugging with launch.json configuration
- **Hot Reload**: Uvicorn with --reload flag for development

### Debugging Patterns

- **Backend**: Use FastAPI's automatic docs at `/docs` for API testing
- **Frontend**: Browser DevTools console logging for JavaScript debugging
- **Data**: Direct JSON file inspection for data validation

## File Structure & Responsibilities

```text
src/
├── app.py                 # Main FastAPI application
├── data_manager.py        # Data persistence and business logic
├── data/
│   ├── activities.json    # Mentorship activities data
│   └── users.json         # User profiles and permissions
└── static/
    ├── index.html         # Main dashboard interface
    ├── app.js             # Frontend application logic
    ├── styles.css         # Custom styles
    └── img/               # Static assets
```

## Best Practices for This Project

1. **Maintain English UI**: All user-facing text should be in English
2. **Permission-First**: Always check permissions before operations
3. **Cache Awareness**: Use timestamp-based cache busting for data freshness
4. **Error Feedback**: Provide clear, actionable error messages
5. **Responsive Design**: Ensure mobile compatibility with Tailwind utilities
6. **Data Consistency**: Maintain referential integrity between activities and users

## Environment Configuration

- **Port**: Application runs on port 8000
- **Host**: 0.0.0.0 for container accessibility
- **Dependencies**: Listed in requirements.txt (FastAPI, Uvicorn)
- **Python Version**: 3.13 in dev container

## Deployment Notes

- Uses FastAPI's StaticFiles mounting for frontend serving
- JSON files serve as database (suitable for small-scale deployment)
- No external database dependencies required
- Can be containerized with current dev container configuration