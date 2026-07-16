# Additional Bugs Found & Fixes Needed

## Bug #5: Teacher-Student Association Missing ❌
**Status**: NOT FIXED  
**Issue**: Teachers can see ALL students in the system, not just their own
**Root Cause**: 
- Backend `/api/students/` endpoint returns all students regardless of who requested them
- No teacher_id or student_teacher_map table exists
- Frontend component has no way to filter by current teacher

**Impact**: Teachers can see and manage students they didn't create. Privacy violation.

**Fix Needed**:
```python
# Backend should filter by teacher
if user.role == 'teacher':
    # Only show students this teacher created/assigned
    students = User.query.filter_by(role='student', created_by=uid).all()
else:
    # Admin sees all
    students = User.query.filter_by(role='student').all()
```

---

## Bug #6: No Teacher Context in Students Page ❌
**Status**: NOT FIXED  
**Issue**: StudentProfileModal and AdminStudents don't know which role the user is
**Root Cause**: 
- Component doesn't use `useAuth()` to get current user
- Can't differentiate between admin and teacher permissions

**Impact**: Teachers and admins see the same UI, even though teachers should have limited permissions

**Fix Needed**:
```javascript
// Add to AdminStudents
const { user } = useAuth();
const isTeacher = user?.role === 'teacher';

// Then conditionally render permissions:
{!isTeacher && <DeleteButton>}  // Only admin can delete
```

---

## Bug #7: Frontend Routing Issue ❌
**Status**: NOT FIXED  
**Issue**: When teacher doesn't have a matching role in sidebar, they might see wrong pages
**Root Cause**: 
- Sidebar treats teachers as admins (line 161 in Sidebar.jsx)
- But teacher role isn't properly handled in App.jsx routing

**Impact**: Confusing UI, teachers might see pages they shouldn't

**Fix Needed**:
```javascript
// Sidebar.jsx line 161
const nav = user?.role === 'admin' ? ADMIN_NAV : 
            user?.role === 'teacher' ? TEACHER_NAV :
            STUDENT_NAV;

// Create TEACHER_NAV with limited permissions
const TEACHER_NAV = [
  { id: 'teacher-home', icon: '⊞', label: 'Dashboard', group: 'main' },
  { id: 'teacher-students', icon: '👥', label: 'My Students', group: 'main' },
  // ... other teacher-specific items
];
```

---

## Bug #8: Delete Permission Check Missing ❌
**Status**: NOT FIXED  
**Issue**: Frontend doesn't check permissions before showing delete button
**Root Cause**: 
- No role-based UI filtering in StudentProfileModal
- Teachers might be able to delete admin-created students

**Impact**: Permission inconsistency between frontend and backend

---

## Bug #9: No Student-Teacher Association Database ❌
**Status**: NOT FIXED  
**Issue**: No way to track which students belong to which teacher
**Root Cause**: 
- User model doesn't have teacher_id or created_by field
- No teacher_student relationship defined

**Impact**: Can't implement proper teacher-student filtering

**Fix Needed**:
```sql
-- Add migration
ALTER TABLE user ADD COLUMN teacher_id INTEGER REFERENCES user(id);

-- Or create junction table
CREATE TABLE teacher_student (
    teacher_id INTEGER REFERENCES user(id),
    student_id INTEGER REFERENCES user(id),
    PRIMARY KEY (teacher_id, student_id)
);
```

---

## Summary of All 9 Bugs

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | NotificationProvider Missing | 🔴 HIGH | ✅ FIXED |
| 2 | Profile Modal Never Opens | 🔴 HIGH | ✅ FIXED |
| 3 | Plan Assignment Not Persisting | 🔴 HIGH | ✅ FIXED |
| 4 | Silent Error Handling | 🟡 MEDIUM | ✅ FIXED |
| 5 | Teacher-Student Association Missing | 🔴 HIGH | ❌ NOT FIXED |
| 6 | No Teacher Context in UI | 🔴 HIGH | ❌ NOT FIXED |
| 7 | Frontend Routing Issue | 🟡 MEDIUM | ❌ NOT FIXED |
| 8 | Delete Permission Check Missing | 🟡 MEDIUM | ❌ NOT FIXED |
| 9 | No Student-Teacher Database | 🔴 HIGH | ❌ NOT FIXED |

---

## Recommendation

**For a complete fix**, the following need to be implemented:

1. **Database Schema**: Add teacher_id or teacher_student table
2. **Backend Filtering**: Filter students by teacher in `/api/students/`
3. **Frontend Role Handling**: Use useAuth() in components, create TEACHER_NAV
4. **Permission Checks**: Add role validation on delete/edit operations
5. **Component Updates**: 
   - Add teacher filtering to AdminStudents
   - Create separate teacher dashboard
   - Add permission-based UI rendering

Currently, **4/9 bugs are fixed** (44% complete).

