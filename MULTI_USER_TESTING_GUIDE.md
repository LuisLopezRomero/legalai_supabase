# 🧪 Multi-User System Testing Guide

## Testing Environment

**Dev Server:** https://3000-i5s33sylkioq6bwtgesvz-c07dda5e.sandbox.novita.ai
**Database:** Supabase (production instance)
**Organization:** Bufete López (Vicente's organization)

---

## ✅ Pre-Testing Checklist

### Database Verification
- [x] Tables created: organizations, user_profiles, expediente_assignments
- [x] RLS policies enabled and tested
- [x] Admin user created: Vicente
- [x] Organization created: Bufete López

### Code Verification
- [x] AuthContext implemented and working
- [x] Role-based filtering in fetchEmails/fetchCases
- [x] UserManagement component (admin-only)
- [x] EmailAssignments component (admin-only)
- [x] All components updated for multi-user

---

## 📋 Test Plan

### Phase 1: Admin User Testing (Vicente)

#### 1.1 Authentication & Profile
- [ ] Login with Vicente's credentials
- [ ] Verify AuthContext loads:
  - [ ] userProfile with role='admin'
  - [ ] organization='Bufete López'
  - [ ] isAdmin=true

**How to verify:** Open browser DevTools → Console → Type:
```javascript
// Check AuthContext state
console.log('User Profile:', window.__AUTH_CONTEXT__); // If exposed
```

#### 1.2 Navigation Access (Admin)
- [ ] Sidebar shows 4 items:
  - [ ] 📥 Inbox
  - [ ] 💼 Expedientes
  - [ ] 📋 Asignaciones (Admin only)
  - [ ] 👥 Usuarios (Admin only)

#### 1.3 User Management
- [ ] Navigate to "Usuarios"
- [ ] See existing user (Vicente) in table
- [ ] Click "Invitar Usuario" button
- [ ] Fill form:
  - Email: `maria@bufetelopez.com`
  - Nombre: `María González`
  - Rol: `Member`
- [ ] Submit and verify:
  - [ ] Success message appears
  - [ ] María appears in users table
  - [ ] María has role badge "👤 Member"
  - [ ] María's status is "✓ Activo"

#### 1.4 Email Assignment
- [ ] Navigate to "Asignaciones"
- [ ] Verify statistics show:
  - [ ] Total emails count
  - [ ] Assigned emails count
  - [ ] Unassigned emails count
- [ ] Select an unassigned email
- [ ] Click "Asignar" button
- [ ] Modal opens with email details
- [ ] Select "María González - 👤 Member" from dropdown
- [ ] Click "Guardar Asignación"
- [ ] Verify:
  - [ ] Email now shows "Asignado a: María González"
  - [ ] Statistics updated (Assigned +1, Unassigned -1)
  - [ ] Button changed to "Reasignar"

#### 1.5 Inbox View (Admin)
- [ ] Navigate to "Inbox"
- [ ] Verify can see ALL organization emails
- [ ] Verify filter dropdown shows:
  - [ ] "Todos los correos"
  - [ ] "Correos sin Asignar"
  - [ ] List of expedientes
- [ ] Select an email
- [ ] Verify email detail panel shows
- [ ] Verify AI panel is visible (right side)

#### 1.6 Case Management (Admin)
- [ ] Navigate to "Expedientes"
- [ ] Verify can see ALL organization cases
- [ ] Click "Nuevo Expediente" button
- [ ] Fill case form with test data
- [ ] Save and verify:
  - [ ] Case appears in list
  - [ ] Case has organization_id set
  - [ ] Case has created_by_user_id = Vicente

---

### Phase 2: Member User Testing (María)

#### 2.1 Get María's Login Credentials
- [ ] Check María's email for confirmation link
- [ ] Click confirmation link
- [ ] Set password for María
- [ ] Remember credentials

**Note:** If using signUp (current implementation), María receives:
- Confirmation email with link to set password
- After confirmation, can login

#### 2.2 Authentication & Profile (Member)
- [ ] Logout as Vicente
- [ ] Login with María's credentials
- [ ] Verify AuthContext loads:
  - [ ] userProfile with role='member'
  - [ ] organization='Bufete López'
  - [ ] isAdmin=false
  - [ ] isMember=true

#### 2.3 Navigation Access (Member)
- [ ] Sidebar shows ONLY 2 items:
  - [ ] 📥 Inbox
  - [ ] 💼 Expedientes
- [ ] Verify "Asignaciones" button is NOT visible
- [ ] Verify "Usuarios" button is NOT visible

#### 2.4 Inbox View (Member)
- [ ] Navigate to "Inbox"
- [ ] Verify sees ONLY assigned emails
- [ ] Count emails visible
- [ ] Verify cannot see unassigned emails
- [ ] Select assigned email
- [ ] Verify can interact with email normally

**Expected behavior:**
- Should only see the email(s) assigned by Vicente in Phase 1.4
- Total count should match assigned count, not organization total

#### 2.5 Case Management (Member)
- [ ] Navigate to "Expedientes"
- [ ] Verify sees ONLY:
  - [ ] Cases assigned to María
  - [ ] Cases created by María
- [ ] Create new case
- [ ] Verify new case appears in María's list
- [ ] Verify cannot see Vicente's cases (unless assigned)

#### 2.6 Restricted Access Verification
- [ ] Try to access user management (if URL known)
- [ ] Verify "Acceso Denegado" message
- [ ] Try to access assignments (if URL known)
- [ ] Verify "Acceso Denegado" message

---

### Phase 3: Data Isolation Testing

#### 3.1 Email Filtering
**As Vicente (Admin):**
- [ ] Note total email count in Inbox
- [ ] Assign 3 emails to María
- [ ] Note 3 specific email subjects

**As María (Member):**
- [ ] Login and check Inbox
- [ ] Verify sees exactly 3 emails
- [ ] Verify subjects match Vicente's notes
- [ ] Verify cannot see other emails

**As Vicente (Admin):**
- [ ] Unassign 1 email from María
- [ ] Note which one

**As María (Member):**
- [ ] Refresh/re-login
- [ ] Verify now sees only 2 emails
- [ ] Verify unassigned email disappeared

#### 3.2 Case Filtering
**As Vicente (Admin):**
- [ ] Create a new expediente
- [ ] Don't assign it to anyone
- [ ] Note expediente title

**As María (Member):**
- [ ] Check Expedientes list
- [ ] Verify cannot see Vicente's new expediente

**As Vicente (Admin):**
- [ ] Navigate to Asignaciones (future feature: expediente assignments)
- [ ] Or manually insert assignment in Supabase:
```sql
INSERT INTO expediente_assignments (expediente_id, assigned_to_user_id, assigned_by_user_id)
VALUES ('vicente_case_id', 'maria_user_id', 'vicente_user_id');
```

**As María (Member):**
- [ ] Refresh Expedientes
- [ ] Verify now sees the assigned expediente

---

### Phase 4: Security Testing

#### 4.1 RLS Policy Verification
**Test in Supabase SQL Editor:**
```sql
-- Set user context to María
SET LOCAL request.jwt.claims TO '{"sub": "maria_user_id"}';

-- Try to query all emails (should only return María's)
SELECT COUNT(*) FROM emails WHERE organization_id = 'bufete_lopez_id';
-- Expected: Only emails where assigned_to_user_id = maria_user_id

-- Try to query all expedientes (should only return María's)
SELECT COUNT(*) FROM expedientes WHERE organization_id = 'bufete_lopez_id';
-- Expected: Only expedientes where María is assigned or creator
```

#### 4.2 API Endpoint Testing
**Using browser DevTools Network tab:**
- [ ] Login as María
- [ ] Monitor network requests for fetchEmails
- [ ] Verify query includes: `assigned_to_user_id.eq.maria_id`
- [ ] Verify response contains only María's emails

#### 4.3 URL Manipulation Testing
**As María (Member):**
- [ ] Try to manually navigate to: `/users` (if route exists)
- [ ] Try to manually navigate to: `/assignments`
- [ ] Verify both show "Acceso Denegado"
- [ ] Try to navigate to admin-only views
- [ ] Verify proper access control

---

### Phase 5: User Management Features

#### 5.1 Role Changes
**As Vicente (Admin):**
- [ ] Go to "Usuarios"
- [ ] Find María in list
- [ ] Click role toggle button (Admin ↔ Member)
- [ ] Change María to Admin
- [ ] Verify badge updates to "👑 Admin"

**As María (now Admin):**
- [ ] Logout and login again
- [ ] Verify sidebar now shows 4 items (including admin buttons)
- [ ] Verify can access "Usuarios" and "Asignaciones"
- [ ] Verify sees ALL emails and cases

**As Vicente (Admin):**
- [ ] Change María back to Member
- [ ] Verify role updates

#### 5.2 User Deactivation
**As Vicente (Admin):**
- [ ] Go to "Usuarios"
- [ ] Click deactivate button for María
- [ ] Verify status changes to "✗ Inactivo"

**As María (Deactivated):**
- [ ] Logout
- [ ] Try to login
- [ ] Verify: Should be blocked or limited (depends on RLS policy)

**As Vicente (Admin):**
- [ ] Reactivate María
- [ ] Verify status back to "✓ Activo"

#### 5.3 User Deletion
**As Vicente (Admin):**
- [ ] Create a test user "Juan Pérez"
- [ ] Verify Juan appears in list
- [ ] Click delete button for Juan
- [ ] Confirm deletion in modal
- [ ] Verify Juan disappears from list

---

## 🐛 Known Issues & Workarounds

### Issue 1: Email Confirmation
**Problem:** signUp requires email confirmation
**Workaround:** 
- Use Supabase Dashboard to manually confirm user
- Or implement Edge Function with service_role for inviteUserByEmail

### Issue 2: Old Data Schema
**Problem:** Existing emails/expedientes may have old schema (user_id instead of organization_id)
**Workaround:**
- Clear old data or run migration script
- Create fresh test data

### Issue 3: Assignment Not Loading
**Problem:** Member sees no emails even when assigned
**Debug steps:**
1. Check assigned_to_user_id matches user.id (not user_profiles.id)
2. Verify RLS policies allow member to read assigned emails
3. Check console for query errors

---

## 📊 Test Results Template

### Test Execution Date: [DATE]
### Tester: [NAME]
### Environment: [DEV/STAGING/PROD]

#### Phase 1: Admin Testing
- [ ] PASS / FAIL - Authentication
- [ ] PASS / FAIL - Navigation
- [ ] PASS / FAIL - User Management
- [ ] PASS / FAIL - Email Assignment
- [ ] PASS / FAIL - Inbox View
- [ ] PASS / FAIL - Case Management

**Issues Found:**
- [List any issues]

#### Phase 2: Member Testing
- [ ] PASS / FAIL - Authentication
- [ ] PASS / FAIL - Navigation (Restricted)
- [ ] PASS / FAIL - Inbox View (Filtered)
- [ ] PASS / FAIL - Case Management (Filtered)
- [ ] PASS / FAIL - Access Restrictions

**Issues Found:**
- [List any issues]

#### Phase 3: Data Isolation
- [ ] PASS / FAIL - Email Filtering
- [ ] PASS / FAIL - Case Filtering

**Issues Found:**
- [List any issues]

#### Phase 4: Security
- [ ] PASS / FAIL - RLS Policies
- [ ] PASS / FAIL - API Endpoints
- [ ] PASS / FAIL - URL Manipulation

**Issues Found:**
- [List any issues]

#### Phase 5: User Management
- [ ] PASS / FAIL - Role Changes
- [ ] PASS / FAIL - User Deactivation
- [ ] PASS / FAIL - User Deletion

**Issues Found:**
- [List any issues]

---

## 🎯 Success Criteria

### Critical (Must Pass)
- ✅ Admins can see all organization data
- ✅ Members can only see assigned data
- ✅ RLS policies enforce data isolation
- ✅ Admin can create and manage users
- ✅ Admin can assign emails to users
- ✅ Role changes take effect immediately

### Important (Should Pass)
- ✅ User invitation workflow completes
- ✅ Email confirmations work
- ✅ UI correctly hides admin features from members
- ✅ Case creation includes organization_id
- ✅ Assignments persist across sessions

### Nice to Have (May Pass)
- ✅ Search and filters work correctly
- ✅ Statistics are accurate
- ✅ Error messages are helpful
- ✅ Loading states are smooth

---

## 🚀 Quick Start Testing

### Fastest Way to Test:

1. **Open Dev Server:** https://3000-i5s33sylkioq6bwtgesvz-c07dda5e.sandbox.novita.ai

2. **Login as Vicente (Admin):**
   - Email: vicente@bufetelopez.com
   - Password: [Your password]

3. **Quick Checks:**
   - See 4 sidebar buttons? ✅ Admin UI working
   - Go to "Usuarios" → See yourself? ✅ User management working
   - Go to "Asignaciones" → See emails? ✅ Email system working

4. **Create Member User:**
   - Click "Invitar Usuario"
   - Email: test@test.com
   - Name: Test User
   - Role: Member
   - Submit

5. **Test as Member:**
   - Logout
   - Login with test@test.com (after confirmation)
   - See only 2 sidebar buttons? ✅ Member restrictions working
   - See limited data? ✅ Filtering working

---

## 📝 Notes

- All tests should be performed in order
- Document any failures with screenshots
- Check browser console for errors
- Monitor Network tab for API calls
- Verify Supabase logs for RLS denials

---

**Last Updated:** 2025-11-17
**Version:** 1.0
**Status:** Ready for Testing
