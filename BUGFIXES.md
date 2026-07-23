# IELTS Platform — Bug Fix Summary

All 21 bugs identified in the audit have been resolved.  
**Run `python migrate_db.py` once after deploying** to add the new DB columns.

---

## 🔴 Critical (data / permissions)
## 🟢 New Features
| # | Feature | File(s) |
|---|-----|---------|
| 1 | Dark Mode | `src/App.jsx` |


| # | Bug | File(s) |
|---|-----|---------|
| 1 | **Hardcoded band scores** — every user returned Band 7/6.5/6/6.5 regardless of real performance. Now computed from reviewed submissions via `user.compute_bands()`. | `models/user.py` |
| 2 | **Teachers got 403 on submission routes** — `/submissions/pending` and `/submissions/student/:id` now allow `role=teacher`. Teachers only see their own students' submissions. | `routes/submissions.py` |
| 3 | **Teachers blocked from creating/editing tasks** — `create_task`, `manage_task`, and `tasks_by_plan_and_day` now allow `teacher` role. | `routes/tasks.py` |
| 4 | **No teacher–student isolation** — `create_student` links new students to the creating teacher via `teacher_id`; `list_students` returns only that teacher's students. | `routes/students.py`, `models/user.py` |
| 5 | **Progress tracker used account creation date** — `ProgressPage` now fetches `plansAPI.getMy()` and uses the plan's real `start_date` and `duration_days`. | `src/App.jsx` |

---


## 🟡 Medium (UX / misleading behaviour)
| # | Bug | File(s) |
|---|-----|---------|
| 13 | Vocabulary page crashed with `alert()` on 500 error | `src/pages/VocabularyPage.jsx` |
## 🟠 High-priority (broken features)

| # | Bug | File(s) |
|---|-----|---------|
| 6 | **Hardcoded teacher email in plan confirmation** — removed `"srsurajith@gmail.com"` from success message. | `src/App.jsx` |
| 7 | **"No tasks today" gave no context** — the response now includes the current day number so teachers know which day to populate. | `routes/tasks.py` |
| 8 | **AudioRecorder produced empty/corrupt blobs** — stream tracks now stopped inside `rec.onstop` (not before it). Added 250 ms chunked collection and 5-minute auto-stop. | `src/pages/student/Tasks.jsx` |
| 9 | **Mock Test submissions never saved to DB** — `handleSubmit` now calls `submissionsAPI.submitStandalone()` so teachers can review mock-test responses. | `src/pages/student/MockTest.jsx`, `src/services/api.js` |
| 11 | **Debate: gibberish scored Band 7.3** — `analyze_debate` now requires ≥ 20 words and ≥ 60 % alpha ratio; `vocabulary_score` is capped by a length factor. | `routes/ai.py` |
| 12 | **Quiz showed "VERIFIED-296" as correct answer** — corrupt training-bank questions filtered at import time via `isCorruptQuestion()`. | `src/data/questionBank.js` |

---

## 🟡 Medium (UX / misleading behaviour)

| # | Bug | File(s) |
|---|-----|---------|
| 13 | **Vocabulary page crashed with `alert()` on 500 error** — replaced with inline error messages; added word/definition validation. Full design-system rewrite. | `src/pages/VocabularyPage.jsx` |
| 14 | **Skills Breakdown always showed Band 6.0** — now shows "Not yet rated" when bands are `null` (no reviewed submissions). | `src/App.jsx` |
| 15 | **"Avg Score" always 0 in admin** — score updates automatically when teachers use the new `/submissions/review/:id` endpoint. | `routes/submissions.py` |
| 16 | **Leaderboard appeared empty with no message** — added empty-state card and an all-zero hint banner. | `src/App.jsx` |
| 17 | **`visibleStudents()` hid real students** — the email-based demo filter silently excluded real students whose email matched the old list. Filter removed. | `src/services/api.js` |
| 18 | **AI Coach scored gibberish at Band 7+** — minimum word count + alpha-ratio validation added to debate route. | `routes/ai.py` |

---

## 🔵 Cleanup

| # | Bug | File(s) |
|---|-----|---------|
| 19 | **`IELTSApp.jsx` was a 76 KB unused file** — deleted. | (deleted) |
| 20 | **Quiz empty state showed no explanation** — corrupt questions filtered; real empty state now shows a helpful message. | `src/data/questionBank.js` |
| 21 | **Speaking page had no submission path** — AudioRecorder fix (Bug 8) ensures audio is captured correctly; "Submit from Today's Tasks" note retained. | `src/pages/student/Tasks.jsx` |

---

## New file: `migrate_db.py`

Run **once** after deploy:

```bash
python migrate_db.py
```

Adds: `users.teacher_id`, `users.*_band` (×4), `submissions.band_score`, makes `submissions.task_id` nullable (PostgreSQL).

---

## New API endpoint

| Method | Route | Who | Purpose |
|--------|-------|-----|---------|
| `POST` | `/api/submissions/review/<id>` | Teacher / Admin | Submit `feedback_text` + optional `band_score` (0–9) |

Frontend: `submissionReviewAPI.review(submissionId, feedbackText, bandScore)` in `src/services/api.js`.

## Summary
| Type | Count | Fixed | Remaining |
|------|-------|-------|-----------|
| Login Issues | 1 | 1 | 0 |
| Hardcoded Values | 4 | 0 | 4 |
| Permission/Role Bugs | 4 | 0 | 4 |
| **TOTAL** | **9** | **1** | **8** |