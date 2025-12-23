# 🏥 Healthcare System - New Features Implementation

## ✨ TWO NEW FEATURES ADDED

### ✅ Feature 1: Pre-Appointment Medical Report Upload
**Tied to Appointment Booking**

Patients can now upload medical reports when booking appointments, helping doctors prepare better for consultations.

### ✅ Feature 2: Independent Second Opinion Service
**Separate service, no appointment required**

Patients can request second opinions from qualified doctors by uploading medical reports and describing their condition.

---

## 📂 BACKEND STRUCTURE

### New Models Created

#### 1. **MedicalReport.js** (Shared)
Located: `backend/models/MedicalReport.js`

Used by both features to store uploaded medical documents.

**Key Fields:**
- `patient` - Reference to patient
- `reportType` - Type of medical report (lab_test, x_ray, mri, etc.)
- `fileName`, `fileUrl`, `fileSize`, `mimeType`
- `appointment` - Optional link to appointment (Feature 1)
- `secondOpinionRequest` - Optional link to second opinion (Feature 2)

#### 2. **SecondOpinionRequest.js** (New)
Located: `backend/models/SecondOpinionRequest.js`

Manages second opinion requests from patients to doctors.

**Key Fields:**
- `patient`, `assignedDoctor`
- `medicalReports` - Array of uploaded reports
- `chiefComplaint`, `medicalHistory`, `currentMedications`, `allergies`
- `status` - pending, assigned, under_review, completed, cancelled
- `priority` - normal, urgent, emergency
- `doctorOpinion` - Diagnosis, recommendations, treatment

#### 3. **Appointment.js** (Extended)
Located: `backend/models/Appointment.js`

Extended to support medical report attachments.

**New Fields:**
- `medicalReports` - Array of report IDs
- `hasMedicalReports` - Boolean flag

---

### New Controllers

#### 1. **appointmentController.js** (Updated)
Located: `backend/controllers/appointment/appointmentController.js`

**New Functions:**
- `uploadMedicalReports()` - Upload reports to existing appointment
- Multer configuration for file handling

#### 2. **secondOpinionController.js** (New)
Located: `backend/controllers/patient/secondOpinionController.js`

**Patient Functions:**
- `submitSecondOpinion()` - Submit new request with reports
- `getMySecondOpinions()` - Get all patient's requests
- `getSecondOpinionDetails()` - View specific request
- `cancelSecondOpinion()` - Cancel pending/assigned request

#### 3. **secondOpinionReviewController.js** (New)
Located: `backend/controllers/doctor/secondOpinionReviewController.js`

**Doctor Functions:**
- `getPendingRequests()` - View available cases
- `getMyCases()` - View assigned cases
- `acceptRequest()` - Accept a case
- `startReview()` - Start reviewing
- `submitOpinion()` - Submit medical opinion
- `getCaseDetails()` - View case details

---

### New Routes

#### 1. **appointmentRoutes.js** (Updated)
Located: `backend/routes/appointmentRoutes.js`

**New Route:**
```javascript
POST /api/appointments/:appointmentId/upload-reports
```
Middleware: `upload.array('reports', 5)`

#### 2. **secondOpinionRoutes.js** (New)
Located: `backend/routes/secondOpinionRoutes.js`

**Patient Routes:**
```javascript
POST   /api/second-opinions/submit
GET    /api/second-opinions/my-requests
GET    /api/second-opinions/:requestId
PUT    /api/second-opinions/:requestId/cancel
```

**Doctor Routes:**
```javascript
GET    /api/second-opinions/doctor/pending
GET    /api/second-opinions/doctor/my-cases
GET    /api/second-opinions/doctor/:requestId
PUT    /api/second-opinions/doctor/:requestId/accept
PUT    /api/second-opinions/doctor/:requestId/start-review
PUT    /api/second-opinions/doctor/:requestId/submit-opinion
```

---

### Utilities

#### **notificationService.js** (New)
Located: `utils/notificationService.js`

**Notification Events:**
- Appointment booked
- Reports uploaded
- Second opinion submitted
- Request assigned to doctor
- Opinion completed

**Functions:**
- `sendNotification()` - Send single notification
- `sendBatchNotifications()` - Send to multiple recipients
- `sendReminder()` - Send reminder notifications

---

## 📂 FRONTEND STRUCTURE

### API Service Updates

#### **api.js** (Updated)
Located: `frontend-react/src/services/api.js`

**New Exports:**

```javascript
export const appointmentAPI = {
  // ... existing
  uploadMedicalReports: (appointmentId, formData)
}

export const secondOpinionAPI = {
  // Patient
  submitRequest: (formData),
  getMyRequests: (),
  getRequestDetails: (requestId),
  cancelRequest: (requestId),
  
  // Doctor
  getPendingRequests: (),
  getMyCases: (status),
  getCaseDetails: (requestId),
  acceptRequest: (requestId),
  startReview: (requestId),
  submitOpinion: (requestId, opinionData)
}
```

---

### New Pages

#### 1. **BookAppointment.jsx** (Updated)
Located: `frontend-react/src/pages/appointments/BookAppointment.jsx`

**New Features:**
- Medical report type selection
- File upload (max 5 files)
- Report description field
- Real-time file preview
- Two-step process: Book appointment → Upload reports

#### 2. **RequestSecondOpinion.jsx** (New)
Located: `frontend-react/src/pages/patient/RequestSecondOpinion.jsx`

**Features:**
- Comprehensive medical form
- Report type categorization
- Priority selection (normal/urgent/emergency)
- Multi-file upload (max 10 files)
- File preview with size display

#### 3. **MySecondOpinions.jsx** (New)
Located: `frontend-react/src/pages/patient/MySecondOpinions.jsx`

**Features:**
- List all second opinion requests
- Status badges (pending, assigned, under_review, completed)
- Priority indicators
- View doctor's opinion when completed
- Cancel pending requests
- Download reports

#### 4. **DoctorSecondOpinions.jsx** (New)
Located: `frontend-react/src/pages/doctor/DoctorSecondOpinions.jsx`

**Features:**
- Two tabs: Pending Requests | My Cases
- Accept available cases
- Start review process
- Submit detailed medical opinion
- View patient medical history
- Access uploaded reports

---

## 🔐 AUTHENTICATION & SECURITY

### No Auth Changes Required ✅

Both features use **existing authentication middleware**:
- `protect` middleware verifies JWT token
- `req.user.id` identifies patient/doctor
- `req.user.role` enforces role-based access

### File Upload Security

**Multer Configuration:**
- Accepted formats: `.jpg`, `.jpeg`, `.png`, `.pdf`, `.doc`, `.docx`
- Max file size: 10MB per file
- Storage: `backend/uploads/medical-reports/`
- Unique filenames with timestamp

**Access Control:**
- Patients can only upload to their own appointments/requests
- Doctors can only view assigned cases
- Files served through authenticated routes

---

## 📊 DATABASE CHANGES

### New Collections
1. `medicalreports` - Stores all uploaded medical documents
2. `secondopinionrequests` - Stores second opinion requests

### Modified Collections
1. `appointments` - Added `medicalReports` array and `hasMedicalReports` flag

### Indexes Added
```javascript
// MedicalReport
{ patient: 1, uploadDate: -1 }
{ appointment: 1 }
{ secondOpinionRequest: 1 }

// SecondOpinionRequest
{ patient: 1, status: 1 }
{ assignedDoctor: 1, status: 1 }
{ requestDate: -1 }

// Appointment
{ patient: 1, appointmentDate: -1 }
{ doctor: 1, appointmentDate: -1 }
{ status: 1, appointmentDate: 1 }
```

---

## 🚀 HOW TO USE

### For Patients

#### Feature 1: Book Appointment with Reports
1. Navigate to "Book Appointment"
2. Select doctor, date, and time
3. Optionally upload medical reports (max 5)
4. Select report type and add description
5. Submit booking

#### Feature 2: Request Second Opinion
1. Navigate to "Request Second Opinion"
2. Fill out medical information form
3. Upload relevant medical reports (required, max 10)
4. Select priority level
5. Submit request
6. Track status in "My Second Opinions"
7. View doctor's opinion when completed

### For Doctors

#### Review Second Opinion Requests
1. Navigate to "Second Opinions"
2. View "Pending Requests" tab
3. Review patient information and reports
4. Accept case
5. Switch to "My Cases" tab
6. Start review
7. Submit detailed medical opinion

---

## 📦 DEPENDENCIES ADDED

### Backend
```json
{
  "multer": "^2.0.2"
}
```

Already installed automatically.

---

## 🎯 KEY BENEFITS

### Feature 1 Benefits
✅ Doctors can review reports before appointment  
✅ Better preparation leads to more effective consultations  
✅ Reduces appointment time  
✅ Improves diagnosis accuracy

### Feature 2 Benefits
✅ Independent of appointment scheduling  
✅ Urgent cases can be prioritized  
✅ Multiple doctors can provide opinions  
✅ Patient gets expert validation  
✅ No need to visit physically

---

## 📝 API ENDPOINTS SUMMARY

### Appointment Routes
```
POST   /api/appointments/book
POST   /api/appointments/:id/upload-reports [multipart/form-data]
GET    /api/appointments/my-appointments
```

### Second Opinion Routes (Patient)
```
POST   /api/second-opinions/submit [multipart/form-data]
GET    /api/second-opinions/my-requests
GET    /api/second-opinions/:requestId
PUT    /api/second-opinions/:requestId/cancel
```

### Second Opinion Routes (Doctor)
```
GET    /api/second-opinions/doctor/pending
GET    /api/second-opinions/doctor/my-cases
GET    /api/second-opinions/doctor/:requestId
PUT    /api/second-opinions/doctor/:requestId/accept
PUT    /api/second-opinions/doctor/:requestId/start-review
PUT    /api/second-opinions/doctor/:requestId/submit-opinion
```

---

## 🔔 NOTIFICATION FLOW

### Feature 1 Notifications
1. Patient books appointment → "Appointment booked"
2. Patient uploads reports → "Reports uploaded"

### Feature 2 Notifications
1. Patient submits → "Request submitted"
2. Doctor accepts → "Request assigned"
3. Doctor starts review → "Under review"
4. Doctor submits opinion → "Opinion completed"

---

## ✅ TESTING CHECKLIST

### Feature 1
- [ ] Book appointment without reports
- [ ] Book appointment with reports
- [ ] Upload reports after booking
- [ ] Verify file size limits
- [ ] Check file type restrictions
- [ ] Doctor can view uploaded reports

### Feature 2
- [ ] Submit second opinion with required fields
- [ ] Upload multiple report files
- [ ] View request status updates
- [ ] Cancel pending request
- [ ] Doctor accepts request
- [ ] Doctor submits opinion
- [ ] Patient views completed opinion

---

## 🎨 UI/UX HIGHLIGHTS

### Design Consistency
✅ Matches existing design system  
✅ Tailwind CSS styling  
✅ Responsive layout  
✅ Status badges with color coding  
✅ Loading states and error handling  
✅ Success notifications  
✅ File preview with metadata

### User Experience
✅ Clear CTAs (Call-to-Actions)  
✅ Inline validation  
✅ Progress indicators  
✅ Confirmation dialogs  
✅ Helpful placeholder text  
✅ Real-time file list updates

---

## 🔧 CONFIGURATION

### Environment Variables
No new environment variables required. Uses existing:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`

### File Storage
Files stored in: `backend/uploads/medical-reports/`

**Note:** Create this directory or it will be auto-created on first upload.

---

## 🎉 IMPLEMENTATION COMPLETE!

Both features are fully implemented and ready to use. The code follows best practices:

✅ Clean architecture  
✅ Modular design  
✅ Reusable components  
✅ Error handling  
✅ Input validation  
✅ Security measures  
✅ Comprehensive logging  
✅ User-friendly UI

**No breaking changes to existing functionality!**

---

## 📧 Support

For questions or issues, refer to the code comments or contact the development team.

**Happy Coding! 🚀**
