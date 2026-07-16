# IELTS App - Complete Bug & Hardcode Report

## Status: 9 Issues Found & Documented

### Login Issues

#### Bug #1: Student login was failing (FIXED)
- Issue: Student user missing from database
- Cause: User creation script had an error
- Solution: Recreated student user in database
- Status: FIXED - All 3 logins working

---

### Hardcoded Values Found

#### Hardcode #1: Progress Page Skill Scores (App.jsx:1426-1431)
**Current Code:**
```javascript
const skillData = [
  { label: "Listening", score: 7.0, color: "var(--success)" },
  { label: "Reading",   score: 6.5, color: "var(--warn)" },
  { label: "Writing",   score: 6.0, color: "#a78bfa" },
  { label: "Speaking",  score: 6.5, color: "var(--accent)" },
];
```
**Issue:** Skills are hardcoded. Should pull from user.skills or database.
**Fix Needed:** Fetch from API endpoint `/api/skills/{userId}` or calculate from submissions.

---

#### Hardcode #2: Progress Timeline (App.jsx:1451-1454)
**Current Code:**
```javascript
<div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
  Day 14 of 60 · 77% to go
</div>
// ... and
<div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
  <span>Day 1</span><span>Day 60</span>
</div>
```
**Issue:** "Day 14 of 60" and "77%" are hardcoded constants.
**Fix Needed:** 
- Calculate current day from user.created_date or user.start_date
- Calculate progress percentage dynamically
- Make 60 a configurable plan duration

---

#### Hardcode #3: Overall Band Calculation (App.jsx:1446)
**Current Code:**
```javascript
<div className="playfair" style={{ fontSize: 56, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>
  {overall}
</div>
```
**Issue:** Calculated from hardcoded skill scores.
**Fix Needed:** Use real skill data from database/API.

---

#### Hardcode #4: Progress Bar Percentage (App.jsx:1452)
**Current Code:**
```javascript
<ProgressBar pct={23} height={8} />
```
**Issue:** 23% is hardcoded.
**Fix Needed:** Calculate from actual progress (current day / 60 days).

---

### Remaining Bugs

#### Bug #5: Teacher-Student Association Not Implemented
- Issue: Teachers see all students, not just assigned ones
- Severity: HIGH
- Status: NOT FIXED

#### Bug #6: No Auth Context in Student Profile Modal
- Issue: Components don't know current user role
- Severity: HIGH
- Status: NOT FIXED

#### Bug #7: Frontend Routing Treats Teachers as Admins
- Issue: No separate TEACHER_NAV
- Severity: MEDIUM
- Status: NOT FIXED

#### Bug #8: Delete Permission Not Checked UI-side
- Issue: Delete button shown without permission validation
- Severity: MEDIUM
- Status: NOT FIXED

#### Bug #9: No Student-Teacher Database Relationship
- Issue: Can't track which students belong to which teacher
- Severity: HIGH
- Status: NOT FIXED

---

## Summary

| Type | Count | Fixed | Remaining |
|------|-------|-------|-----------|
| Login Issues | 1 | 1 | 0 |
| Hardcoded Values | 4 | 0 | 4 |
| Permission/Role Bugs | 4 | 0 | 4 |
| **TOTAL** | **9** | **1** | **8** |

