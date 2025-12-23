# 📋 API Quick Reference - New Features

## 🔐 Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📤 FEATURE 1: Pre-Appointment Medical Reports

### Upload Reports to Appointment
**Endpoint:** `POST /api/appointments/:appointmentId/upload-reports`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Data:**
```javascript
{
  reports: [File, File, ...],  // Array of files (max 5)
  reportType: "lab_test",       // Optional
  description: "Blood test results from last month"  // Optional
}
```

**Report Types:**
- `lab_test`
- `x_ray`
- `mri`
- `ct_scan`
- `ultrasound`
- `ecg`
- `prescription`
- `medical_history`
- `other`

**Response:**
```json
{
  "success": true,
  "message": "2 medical report(s) uploaded successfully",
  "data": {
    "appointment": "673d5a1b2c8f9a1234567890",
    "reports": [
      {
        "_id": "673d5a1b2c8f9a1234567891",
        "fileName": "blood-test.pdf",
        "reportType": "lab_test",
        "fileUrl": "/uploads/medical-reports/report-1702512123456.pdf",
        "fileSize": 245678,
        "uploadDate": "2025-12-14T05:30:00.000Z"
      }
    ]
  }
}
```

---

## 🩺 FEATURE 2: Second Opinion Service

### Patient Endpoints

#### 1. Submit Second Opinion Request
**Endpoint:** `POST /api/second-opinions/submit`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Data:**
```javascript
{
  // Required
  chiefComplaint: "Persistent chest pain for 2 weeks",
  reports: [File, File, ...],  // Min 1, Max 10 files
  
  // Optional
  medicalHistory: "Hypertension since 2020",
  currentMedications: "Lisinopril 10mg daily",
  allergies: "Penicillin",
  priority: "urgent",  // normal | urgent | emergency
  reportType: "ecg",
  description: "Recent ECG and blood work"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Second opinion request submitted successfully",
  "data": {
    "_id": "673d5a1b2c8f9a1234567892",
    "patient": {...},
    "chiefComplaint": "Persistent chest pain for 2 weeks",
    "status": "pending",
    "priority": "urgent",
    "medicalReports": [...],
    "requestDate": "2025-12-14T05:30:00.000Z",
    "estimatedResponseTime": "12-24 hours"
  }
}
```

#### 2. Get My Second Opinion Requests
**Endpoint:** `GET /api/second-opinions/my-requests`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "status": "completed",
      "assignedDoctor": {
        "name": "Dr. Sarah Johnson",
        "specialization": "Cardiology"
      },
      "chiefComplaint": "...",
      "doctorOpinion": {
        "diagnosis": "...",
        "recommendations": "...",
        "submittedAt": "..."
      }
    }
  ]
}
```

#### 3. Get Request Details
**Endpoint:** `GET /api/second-opinions/:requestId`

**Response:** Full request object with all details

#### 4. Cancel Request
**Endpoint:** `PUT /api/second-opinions/:requestId/cancel`

**Response:**
```json
{
  "success": true,
  "message": "Second opinion request cancelled successfully",
  "data": {...}
}
```

---

### Doctor Endpoints

#### 1. Get Pending Requests
**Endpoint:** `GET /api/second-opinions/doctor/pending`

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "patient": {
        "name": "John Doe",
        "age": 45,
        "gender": "male"
      },
      "chiefComplaint": "...",
      "priority": "urgent",
      "medicalReports": [...],
      "requestDate": "..."
    }
  ]
}
```

#### 2. Get My Cases
**Endpoint:** `GET /api/second-opinions/doctor/my-cases?status=under_review`

**Query Params:**
- `status` (optional): Filter by status

**Response:** Array of assigned cases

#### 3. Get Case Details
**Endpoint:** `GET /api/second-opinions/doctor/:requestId`

**Response:** Full case details including patient info and reports

#### 4. Accept Request
**Endpoint:** `PUT /api/second-opinions/doctor/:requestId/accept`

**Response:**
```json
{
  "success": true,
  "message": "Second opinion request accepted",
  "data": {...}
}
```

#### 5. Start Review
**Endpoint:** `PUT /api/second-opinions/doctor/:requestId/start-review`

**Response:**
```json
{
  "success": true,
  "message": "Review started",
  "data": {...}
}
```

#### 6. Submit Opinion
**Endpoint:** `PUT /api/second-opinions/doctor/:requestId/submit-opinion`

**Body:**
```json
{
  "diagnosis": "Based on the ECG and symptoms, probable angina pectoris",
  "recommendations": "1. Immediate cardiology consultation\n2. Stress test recommended\n3. Consider coronary angiography",
  "prescribedTreatment": "Nitroglycerin 0.4mg sublingual as needed\nAspirin 81mg daily",
  "additionalNotes": "Patient should avoid strenuous activity until further evaluation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Second opinion submitted successfully",
  "data": {
    "status": "completed",
    "completedDate": "2025-12-14T06:30:00.000Z",
    "doctorOpinion": {...}
  }
}
```

---

## 📊 Status Values

### Second Opinion Request Status
- `pending` - Waiting for doctor assignment
- `assigned` - Doctor accepted the case
- `under_review` - Doctor actively reviewing
- `completed` - Opinion submitted
- `cancelled` - Cancelled by patient

### Priority Levels
- `normal` - Response in 24-48 hours
- `urgent` - Response in 12-24 hours
- `emergency` - Immediate attention required

---

## ⚠️ Error Responses

### Common Error Formats

**400 Bad Request:**
```json
{
  "success": false,
  "message": "At least one medical report is required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You can only upload reports for your own appointments"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Second opinion request not found"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Server error while submitting second opinion request"
}
```

---

## 🧪 Testing Examples

### cURL Example - Upload Reports
```bash
curl -X POST http://localhost:5000/api/appointments/673d5a1b2c8f9a1234567890/upload-reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "reports=@/path/to/file1.pdf" \
  -F "reports=@/path/to/file2.jpg" \
  -F "reportType=lab_test" \
  -F "description=Recent blood work"
```

### cURL Example - Submit Second Opinion
```bash
curl -X POST http://localhost:5000/api/second-opinions/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "chiefComplaint=Persistent headaches" \
  -F "priority=urgent" \
  -F "medicalHistory=Migraine history" \
  -F "reports=@/path/to/scan.pdf" \
  -F "reportType=mri"
```

### Postman Collection
Import these endpoints into Postman:
1. Set Authorization: Bearer Token
2. Use form-data for file uploads
3. Add `reports` as file type fields

---

## 📁 File Upload Constraints

### Accepted File Types
- Images: `.jpg`, `.jpeg`, `.png`
- Documents: `.pdf`, `.doc`, `.docx`

### Size Limits
- Per file: 10MB max
- Appointment reports: 5 files max
- Second opinion reports: 10 files max

### File Naming
Files are automatically renamed with timestamp:
```
report-1702512123456-789.pdf
secondopinion-1702512123456-789.jpg
```

---

## 🎯 Integration Tips

### Frontend FormData Construction
```javascript
const formData = new FormData();
formData.append('chiefComplaint', 'Pain in chest');
formData.append('priority', 'urgent');

// Append multiple files
medicalReports.forEach(file => {
  formData.append('reports', file);
});

// Send with axios
await api.post('/second-opinions/submit', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Access Uploaded Files
Files are served statically from:
```
http://localhost:5000/uploads/medical-reports/filename.pdf
```

---

## 🔔 Notification Events

All successful operations trigger notifications:
- Upload → Patient notified
- Submit → Patient notified
- Accept → Patient notified
- Opinion submitted → Patient notified

Check server logs for notification details.

---

**Need help? Check the main implementation guide in `FEATURES_IMPLEMENTATION.md`**
