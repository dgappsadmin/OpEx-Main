# OpEx Hub Testing Guide

## Quick Start Testing

### Backend Setup (Port 8080)
```bash
cd backend
mvn spring-boot:run
```
- Backend runs on: http://localhost:8080
- API endpoints: http://localhost:8080/api/*
- H2 Console: http://localhost:8080/api/h2-console

### Frontend Setup (Port 5173) 
```bash
npm install
npm run dev
```
- Frontend runs on: http://localhost:5173

## Demo Login Credentials

Use these pre-populated users from DataInitializer:

**Admin User:**
- Email: john.doe@company.com
- Password: password123

**Other Test Users:**
- jane.smith@company.com / password123
- mike.johnson@company.com / password123
- sarah.wilson@company.com / password123

## Testing Features

### 1. Authentication
- ✅ Sign In with demo credentials
- ✅ Sign Up new users
- ✅ JWT token handling
- ✅ Auto logout on token expiry

### 2. Initiatives Management
- ✅ View initiatives list (API integrated)
- ✅ Create new initiative (API integrated)
- ✅ Filter by status, site, search
- ✅ Real-time data from backend

### 3. Backend APIs Available
- `/api/auth/signin` - User login
- `/api/auth/signup` - User registration
- `/api/initiatives` - CRUD operations
- `/api/timeline-tasks` - Task management
- `/api/workflow` - Approval workflow
- `/api/comments` - Comments system

## Expected Behavior

1. **First Time Setup**: Backend starts with demo data
2. **Login**: Use john.doe@company.com / password123
3. **Navigation**: All pages load without errors
4. **Data Persistence**: Changes saved to H2 database
5. **Real API Calls**: No mock data in production flow

## Troubleshooting

### Backend Issues
- Check Java 8 is installed
- Verify port 8080 is free
- Check Maven dependencies download

### Frontend Issues  
- Clear browser cache
- Check port 5173 is free
- Verify API calls in Network tab

### Database Issues
- H2 console: http://localhost:8080/api/h2-console
- URL: jdbc:h2:mem:opexdb
- Username: sa / Password: password

## API Testing

Test backend directly:
```bash
# Login
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@company.com","password":"password123"}'

# Get initiatives (use token from login)
curl -X GET http://localhost:8080/api/initiatives \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```