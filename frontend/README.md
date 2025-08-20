# OpEx Hub - Operational Excellence Management System

A comprehensive web application for managing operational excellence initiatives with a complete approval workflow system.

## 🚀 Quick Start

### Prerequisites
- Java 8+ (for backend)
- Node.js 16+ (for frontend)
- Maven 3.6+ (for backend)

### Backend Setup (Java Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
- **Backend URL:** http://localhost:8080
- **API Base:** http://localhost:8080/api
- **H2 Console:** http://localhost:8080/api/h2-console

### Frontend Setup (React + Vite)
```bash
npm install
npm run dev
```
- **Frontend URL:** http://localhost:5173

## 🔐 Demo Login Credentials

**Primary Test Account:**
- **Email:** john.doe@company.com
- **Password:** password123

**Additional Test Accounts:**
- jane.smith@company.com / password123
- mike.johnson@company.com / password123
- sarah.wilson@company.com / password123

## 🏗️ Architecture

### Backend (Java Spring Boot 2.7.x)
- **Database:** H2 In-Memory Database
- **Security:** JWT Authentication
- **ORM:** JPA/Hibernate
- **Java Version:** 8 (1.8)

### Frontend (React + TypeScript)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** Tailwind CSS + shadcn/ui
- **State Management:** React Query (TanStack Query)
- **HTTP Client:** Axios

## 📊 Features

### 🔹 Authentication System
- JWT-based authentication
- Role-based access control
- Secure token management
- Auto-logout on token expiry

### 🔹 Initiative Management
- Create new initiatives with detailed forms
- View and filter initiatives
- Real-time status tracking
- Financial impact calculation

### 🔹 Workflow Management
- 15-stage approval workflow
- Role-based approvals
- Comment system
- Timeline tracking

### 🔹 Reporting & Analytics
- KPI dashboards
- Financial reports
- Progress tracking
- Site-wise analytics

## 🗂️ Project Structure

```
opex-hub/
├── backend/                 # Java Spring Boot backend
│   ├── src/main/java/
│   │   └── com/company/opexhub/
│   │       ├── config/      # Configuration classes
│   │       ├── controller/  # REST controllers
│   │       ├── dto/         # Data transfer objects
│   │       ├── entity/      # JPA entities
│   │       ├── repository/  # Data repositories
│   │       ├── security/    # Security configuration
│   │       └── service/     # Business logic
│   └── src/main/resources/
│       └── application.yml  # Application configuration
├── src/                     # React frontend
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and API client
│   ├── pages/              # Page components
│   └── main.tsx            # Application entry point
└── README.md
```

## 🛡️ API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration

### Initiatives
- `GET /api/initiatives` - List initiatives
- `POST /api/initiatives` - Create initiative
- `GET /api/initiatives/{id}` - Get initiative by ID
- `PUT /api/initiatives/{id}` - Update initiative
- `DELETE /api/initiatives/{id}` - Delete initiative

### Workflow
- `GET /api/workflow/initiative/{id}` - Get workflow stages
- `POST /api/workflow/stage/{id}/approve` - Approve stage
- `POST /api/workflow/stage/{id}/reject` - Reject stage
- `GET /api/workflow/pending/{userId}` - Get pending approvals

### Timeline & Comments
- `GET /api/timeline-tasks/initiative/{id}` - Get tasks
- `POST /api/timeline-tasks` - Create task
- `GET /api/comments/initiative/{id}` - Get comments
- `POST /api/comments` - Add comment

## 🔧 Development

### Backend Development
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database Access
- **H2 Console:** http://localhost:8080/api/h2-console
- **JDBC URL:** jdbc:h2:mem:opexdb
- **Username:** sa
- **Password:** password

## 🎯 Key Features Implemented

### ✅ Complete Authentication System
- Real API integration with JWT
- Secure token storage and management
- Role-based user management

### ✅ Initiative Management
- Full CRUD operations via API
- Advanced filtering and search
- File upload support
- Financial calculations

### ✅ Workflow System
- 15-stage approval process
- Role-based approvals
- Comment system integration
- Real-time status updates

### ✅ Data Persistence
- H2 in-memory database
- JPA entity relationships
- Demo data initialization
- Complete CRUD operations

## 🚀 Production Deployment

### Backend Deployment
```bash
mvn clean package
java -jar target/opex-hub-*.jar
```

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to web server
```

## 🐛 Troubleshooting

### Common Issues

**Backend not starting:**
- Check Java 8 is installed: `java -version`
- Verify port 8080 is free: `lsof -i :8080`
- Check Maven installation: `mvn -version`

**Frontend connection issues:**
- Verify backend is running on port 8080
- Check browser console for CORS errors
- Clear browser cache and cookies

**Database issues:**
- Access H2 console to verify data
- Check application.yml database configuration
- Restart backend to recreate database

### Performance Optimization
- Backend uses connection pooling
- Frontend uses React Query for caching
- Pagination implemented for large datasets
- Optimized bundle size with Vite

## 📈 Future Enhancements

- Real database integration (PostgreSQL/MySQL)
- Email notifications for approvals
- Advanced reporting with charts
- Mobile responsive design improvements
- Integration with external systems

## 📄 License

This project is for internal company use only.

---

**OpEx Hub** - Streamlining Operational Excellence Initiatives 🎯