# Testing Guide: Medical Record Patient Search

## Prerequisites
- Backend server running on `http://localhost:5000` (or your configured port)
- Valid authentication tokens for doctor, patient, and admin users
- At least one patient registered in the system

---

## 🧪 Test Scenarios

### **Scenario 1: Doctor Searches for Patients**

**Endpoint:** `GET /api/medical-records/search/patients?query={searchTerm}`

**Test Cases:**

#### Test 1.1: Search by patient name
```bash
curl -X GET "http://localhost:5000/api/medical-records/search/patients?query=john" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Returns list of patients with "john" in their name
- Each patient object contains: `_id`, `name`, `email`, `phone`, `createdAt`

#### Test 1.2: Search by patient email
```bash
curl -X GET "http://localhost:5000/api/medical-records/search/patients?query=john@example.com" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Returns patient(s) matching the email

#### Test 1.3: Search by patient phone
```bash
curl -X GET "http://localhost:5000/api/medical-records/search/patients?query=1234567890" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Returns patient(s) matching the phone number

#### Test 1.4: Invalid search (too short)
```bash
curl -X GET "http://localhost:5000/api/medical-records/search/patients?query=j" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

**Expected Result:**
- Status: 400 Bad Request
- Error message: "Please provide a search query (minimum 2 characters)"

#### Test 1.5: Unauthorized access (patient trying to search)
```bash
curl -X GET "http://localhost:5000/api/medical-records/search/patients?query=john" \
-H "Authorization: Bearer PATIENT_TOKEN"
```

**Expected Result:**
- Status: 403 Forbidden
- Error message: "Only doctors can search for patients"

---

### **Scenario 2: Doctor Gets Their Appointments**

**Endpoint:** `GET /api/medical-records/doctor/appointments`

#### Test 2.1: Get doctor's appointments
```bash
curl -X GET "http://localhost:5000/api/medical-records/doctor/appointments" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Returns list of appointments with populated patient details
- Each appointment contains: appointment date, time, status, and patient info

---

### **Scenario 3: Doctor Creates Medical Record (NEW METHODS)**

**Endpoint:** `POST /api/medical-records`

#### Test 3.1: Create record using patient email ✅ **RECOMMENDED**
```bash
curl -X POST "http://localhost:5000/api/medical-records" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "patientEmail": "patient@example.com",
  "diagnosis": "Common Cold",
  "symptoms": "Runny nose, fever, cough",
  "treatmentPlan": "Rest, plenty of fluids, and paracetamol",
  "prescription": "Paracetamol 500mg, twice daily",
  "vitalSigns": {
    "temperature": 38.5,
    "bloodPressure": { "systolic": 120, "diastolic": 80 },
    "heartRate": 75
  }
}'
```

**Expected Result:**
- Status: 201 Created
- Medical record created successfully
- Returns populated record with patient and doctor details

#### Test 3.2: Create record using patient phone
```bash
curl -X POST "http://localhost:5000/api/medical-records" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "patientPhone": "+1234567890",
  "diagnosis": "Hypertension",
  "symptoms": "High blood pressure, headaches",
  "treatmentPlan": "Blood pressure medication and lifestyle changes"
}'
```

**Expected Result:**
- Status: 201 Created
- Medical record created successfully

#### Test 3.3: Create record using patient name
```bash
curl -X POST "http://localhost:5000/api/medical-records" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "patientName": "John Doe",
  "diagnosis": "Diabetes Type 2",
  "symptoms": "Increased thirst, frequent urination",
  "treatmentPlan": "Metformin and dietary changes"
}'
```

**Expected Result:**
- Status: 201 Created
- Medical record created successfully

#### Test 3.4: Create record using appointment ID
```bash
curl -X POST "http://localhost:5000/api/medical-records" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "appointmentId": "60d5ec49f1b2c72b8c8e5a1a",
  "diagnosis": "Annual Checkup",
  "symptoms": "None",
  "treatmentPlan": "Continue healthy lifestyle"
}'
```

**Expected Result:**
- Status: 201 Created
- Patient automatically selected from appointment

#### Test 3.5: Patient not found
```bash
curl -X POST "http://localhost:5000/api/medical-records" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "patientEmail": "nonexistent@example.com",
  "diagnosis": "Test",
  "symptoms": "Test"
}'
```

**Expected Result:**
- Status: 404 Not Found
- Error message: "Patient not found. Please verify the patient information."

#### Test 3.6: No patient identifier provided
```bash
curl -X POST "http://localhost:5000/api/medical-records" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "diagnosis": "Test",
  "symptoms": "Test"
}'
```

**Expected Result:**
- Status: 400 Bad Request
- Error message: "Please provide patient identifier (email, phone, name, or appointment ID)"

---

### **Scenario 4: Admin Views All Medical Records**

**Endpoint:** `GET /api/medical-records/admin/all`

#### Test 4.1: Admin gets all records
```bash
curl -X GET "http://localhost:5000/api/medical-records/admin/all" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Returns all medical records from all doctors
- Includes patient and doctor details
- Supports pagination

#### Test 4.2: Admin gets records with pagination
```bash
curl -X GET "http://localhost:5000/api/medical-records/admin/all?page=1&limit=10" \
-H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Returns paginated results (10 records per page)
- Includes total count and page info

---

### **Scenario 5: Patient Views Own Records**

**Endpoint:** `GET /api/medical-records/me`

#### Test 5.1: Patient gets own records
```bash
curl -X GET "http://localhost:5000/api/medical-records/me" \
-H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Returns all medical records for the patient
- Includes doctor details who created each record

---

## 🔐 Role-Based Access Control Tests

### Test: Doctor Cannot Access Admin Endpoint
```bash
curl -X GET "http://localhost:5000/api/medical-records/admin/all" \
-H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

**Expected Result:**
- Status: 403 Forbidden
- Error message: "Only administrators can access all medical records"

### Test: Patient Cannot Search for Other Patients
```bash
curl -X GET "http://localhost:5000/api/medical-records/search/patients?query=john" \
-H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

**Expected Result:**
- Status: 403 Forbidden
- Error message: "Only doctors can search for patients"

### Test: Patient Cannot Create Medical Records
```bash
curl -X POST "http://localhost:5000/api/medical-records" \
-H "Authorization: Bearer YOUR_PATIENT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "patientEmail": "test@example.com",
  "diagnosis": "Test"
}'
```

**Expected Result:**
- Status: 403 Forbidden
- Error message: "Only doctors can create medical records"

---

## 📊 Postman Collection

### Import this collection into Postman for easier testing:

```json
{
  "info": {
    "name": "Medical Records - Patient Search",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Search Patients",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{doctor_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/medical-records/search/patients?query=john",
          "host": ["{{base_url}}"],
          "path": ["api", "medical-records", "search", "patients"],
          "query": [
            {
              "key": "query",
              "value": "john"
            }
          ]
        }
      }
    },
    {
      "name": "Create Record with Email",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{doctor_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"patientEmail\": \"patient@example.com\",\n  \"diagnosis\": \"Common Cold\",\n  \"symptoms\": \"Fever, cough\",\n  \"treatmentPlan\": \"Rest and fluids\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/medical-records",
          "host": ["{{base_url}}"],
          "path": ["api", "medical-records"]
        }
      }
    },
    {
      "name": "Admin - Get All Records",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/medical-records/admin/all",
          "host": ["{{base_url}}"],
          "path": ["api", "medical-records", "admin", "all"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    },
    {
      "key": "doctor_token",
      "value": "YOUR_DOCTOR_TOKEN_HERE"
    },
    {
      "key": "admin_token",
      "value": "YOUR_ADMIN_TOKEN_HERE"
    },
    {
      "key": "patient_token",
      "value": "YOUR_PATIENT_TOKEN_HERE"
    }
  ]
}
```

---

## ✅ Checklist

Before considering the implementation complete, verify:

- [ ] Doctor can search for patients by name
- [ ] Doctor can search for patients by email
- [ ] Doctor can search for patients by phone
- [ ] Doctor can retrieve their appointments with patient details
- [ ] Doctor can create medical record using patient email
- [ ] Doctor can create medical record using patient phone
- [ ] Doctor can create medical record using patient name
- [ ] Doctor can create medical record using appointment ID
- [ ] Admin can view all medical records
- [ ] Patient can view only their own records
- [ ] Proper error handling for invalid searches
- [ ] Role-based access control enforced
- [ ] No MongoDB IDs exposed to doctors in UI

---

## 🐛 Common Issues & Solutions

### Issue 1: "Patient not found" error
**Solution:** Ensure the patient exists in the database with `role: 'patient'` and the identifier (email/phone/name) matches exactly.

### Issue 2: Search returns empty array
**Solution:** 
- Check if patients exist in the database
- Ensure search query is at least 2 characters
- Verify the search term matches patient data

### Issue 3: "Only doctors can create medical records" error
**Solution:** Verify the JWT token is valid and the user role is set to `'doctor'`.

### Issue 4: Appointment validation fails
**Solution:** Ensure the appointment exists and belongs to the doctor making the request.

---

## 📝 Notes

- All endpoints require valid JWT authentication
- Search is case-insensitive
- Search results are limited to 20 patients
- Appointments are limited to 50 most recent
- Admin pagination defaults to 20 records per page

---

**Last Updated:** December 25, 2025
