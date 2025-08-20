# OpEx Hub Backend - Java Spring Boot

## 🚀 Phase 3: Complete Backend Implementation

### **Tech Stack**
- **Java 8 (1.8)**
- **Spring Boot 2.7.18**
- **H2 In-Memory Database**
- **JWT Authentication**
- **Spring Security**
- **JPA/Hibernate**

### **Setup Instructions**

1. **Prerequisites:**
   ```bash
   Java 8 (1.8) installed
   Maven 3.6+
   ```

2. **Run Application:**
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

3. **Access:**
   - **API Base URL:** `http://localhost:8080/api`
   - **H2 Console:** `http://localhost:8080/api/h2-console`
   - **H2 Credentials:** username: `sa`, password: `password`

### **API Endpoints**

#### **Authentication**
- `POST /auth/signin` - User login
- `POST /auth/signup` - User registration

#### **Initiatives**
- `GET /initiatives` - Get all initiatives (with pagination/filtering)
- `GET /initiatives/{id}` - Get initiative by ID
- `POST /initiatives` - Create new initiative
- `PUT /initiatives/{id}` - Update initiative
- `DELETE /initiatives/{id}` - Delete initiative

#### **Frontend Integration**
Update your frontend API calls to point to:
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

### **Database Schema**
- **users** - User authentication & profiles
- **initiatives** - Main OpEx initiatives
- **timeline_tasks** - Task management with RACI
- **comments** - Activity history
- **workflow_stages** - 15-stage approval process

### **JWT Security**
All endpoints (except auth) require `Authorization: Bearer <token>` header.

### **Ready for Testing!**
Backend fully supports the frontend OpEx Hub with complete CRUD operations, authentication, and workflow management.