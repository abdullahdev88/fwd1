# Deployment Issue Fix Guide - MyClinic.pk

## Issues Fixed ✅

### 1. **Hardcoded localhost URLs** (MAIN ISSUE)
- ❌ **Problem**: All API calls were using `http://localhost:5000` hardcoded in the code
- ✅ **Solution**: Updated all files to use environment variable `VITE_API_URL`

#### Files Fixed:
- `frontend-react/src/pages/admin/AdminDashboard.jsx`
- `frontend-react/src/pages/doctor/DoctorDashboard.jsx`
- `frontend-react/src/pages/appointments/PatientAppointments.jsx`
- `frontend-react/src/pages/patient/MySecondOpinions.jsx`
- `frontend-react/src/pages/doctor/DoctorSecondOpinions.jsx`

### 2. **CORS Configuration**
- ✅ Added proper CORS configuration for production
- ✅ Updated both `backend/server.js` and `backend/api/index.js`

### 3. **Better Error Logging**
- ✅ Added detailed error logging
- ✅ Added database connection status monitoring
- ✅ Added request/response logging for debugging

---

## Deployment Steps

### **Backend (Vercel)**

1. **Environment Variables** - Add these to your Vercel project:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=https://myclinic-patient-portal.netlify.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   vercel --prod
   ```

3. **Your Backend URL**: `https://myclinic-api-five.vercel.app`

---

### **Frontend (Netlify)**

1. **Environment Variables** - Add to Netlify:
   ```
   VITE_API_URL=https://myclinic-api-five.vercel.app/api
   ```

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `frontend-react`

3. **Deploy**:
   ```bash
   cd frontend-react
   npm run build
   netlify deploy --prod --dir=dist
   ```

4. **Your Frontend URL**: `https://myclinic-patient-portal.netlify.app`

---

## Verification Steps

### 1. **Check Backend Health**
```bash
curl https://myclinic-api-five.vercel.app/api/health
```
**Expected Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "Connected"
}
```

### 2. **Check Admin Dashboard**
1. Login as admin
2. Navigate to `/admin/dashboard`
3. Check if stats are loading (Total Users, Patients, Doctors, Appointments)
4. Open browser DevTools → Network tab
5. Verify API calls are going to `https://myclinic-api-five.vercel.app/api/...`

### 3. **Check Doctor Dashboard**
1. Login as doctor
2. Navigate to `/doctor/dashboard`
3. Check if appointments are loading
4. Check if availability is displayed

### 4. **Check Patient Dashboard**
1. Login as patient
2. Check appointments
3. Check payment functionality

---

## Common Issues & Solutions

### Issue 1: "0" showing on all dashboard cards
**Cause**: API calls failing due to hardcoded localhost URLs or CORS errors

**Solution**: ✅ Fixed by using environment variables

---

### Issue 2: CORS Error in Browser Console
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: 
1. Verify `FRONTEND_URL` is set in Vercel environment variables
2. Redeploy backend after adding environment variable
3. Clear browser cache

---

### Issue 3: Database Connection Error
**Error**: `MongoDB Connection Error`

**Solution**:
1. Check `MONGODB_URI` in Vercel environment variables
2. Verify MongoDB Atlas network access (Allow all IPs: `0.0.0.0/0`)
3. Check MongoDB Atlas username/password in connection string
4. Check database name in connection string

---

### Issue 4: Users Not Showing in Admin Panel
**Cause**: Database is empty OR API not connected properly

**Solution**:
1. Check MongoDB Atlas - verify users exist in database
2. Check Vercel logs for errors: `vercel logs [deployment-url]`
3. Test API directly: `curl https://myclinic-api-five.vercel.app/api/admin/dashboard-stats`

---

## Testing Checklist ✓

After deployment, test these features:

### Admin Dashboard
- [ ] Login as admin works
- [ ] Total users count displays correctly
- [ ] Patients count displays correctly
- [ ] Approved doctors count displays correctly
- [ ] Total appointments count displays correctly
- [ ] Pending doctor approvals show up
- [ ] User management works
- [ ] Payment statistics load

### Doctor Dashboard
- [ ] Login as doctor works
- [ ] Appointments list loads
- [ ] Availability calendar loads
- [ ] Can add new availability
- [ ] Can update appointments
- [ ] Prescriptions work

### Patient Dashboard
- [ ] Login as patient works
- [ ] Appointments list loads
- [ ] Can book new appointments
- [ ] Payment functionality works
- [ ] Can download invoices

---

## How to Add Sample Data (If Database is Empty)

If your production database is empty, you need to add some test data:

### Option 1: Manual Registration
1. Register a new user as patient
2. Register a new user as doctor
3. Admin needs to approve doctor

### Option 2: Use Seed Script
```bash
cd backend
node seedDatabase.js
```

### Option 3: MongoDB Compass (GUI)
1. Connect to your MongoDB Atlas database
2. Insert documents manually in:
   - `users` collection
   - `appointments` collection

---

## Important URLs

- **Frontend**: https://myclinic-patient-portal.netlify.app
- **Backend API**: https://myclinic-api-five.vercel.app/api
- **API Health**: https://myclinic-api-five.vercel.app/api/health

---

## Monitoring & Logs

### View Backend Logs (Vercel)
```bash
vercel logs https://myclinic-api-five.vercel.app
```

### View Frontend Logs (Netlify)
1. Go to Netlify Dashboard
2. Click on your site
3. Click "Deploys"
4. Click on latest deploy
5. Check "Deploy log"

---

## Support Commands

### Redeploy Backend
```bash
cd backend
vercel --prod
```

### Redeploy Frontend
```bash
cd frontend-react
npm run build
netlify deploy --prod --dir=dist
```

### Check Environment Variables
```bash
# Vercel
vercel env ls

# Netlify
netlify env:list
```

---

## Success Indicators ✅

Your deployment is successful when:

1. ✅ Admin dashboard shows correct user counts (not 0)
2. ✅ No CORS errors in browser console
3. ✅ No 404 errors for API calls
4. ✅ All API calls use `https://myclinic-api-five.vercel.app/api`
5. ✅ Database connection is successful
6. ✅ Users can login successfully
7. ✅ Data loads in real-time

---

## Next Steps After Deployment

1. **Test All Features** - Go through the testing checklist above
2. **Monitor Logs** - Check Vercel and Netlify logs for any errors
3. **Add Sample Data** - If database is empty, add test data
4. **Share Links** - Share frontend URL with users
5. **Document Credentials** - Save admin/test user credentials

---

## Contact & Support

If you encounter any issues:
1. Check browser console for errors
2. Check Vercel logs for backend errors
3. Verify all environment variables are set correctly
4. Test API endpoints directly using curl or Postman

---

**Last Updated**: December 28, 2024
**Status**: ✅ All Issues Fixed
