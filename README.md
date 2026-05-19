
# 🗳️ Secure Online Election Management System

A full-stack Secure Online Election Management System developed using **React/Angular + Supabase**.  
This platform provides secure, transparent, and anonymous online voting with role-based access control, live results, audit logs, and election management features.

---

# 📌 Project Objective

The objective of this project is to create a secure online election platform where:

- Election creators can create and manage elections
- Admins can approve or reject election requests
- Users can securely participate in elections
- Anonymous voting is ensured
- Duplicate voting is prevented
- Live results and transparency are maintained

---

# 🚀 Tech Stack

## Frontend
- React.js / Angular
- Tailwind CSS / Bootstrap
- React Router
- Axios

## Backend & Database
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)

## Deployment
- Vercel

## Charts & Analytics
- Chart.js / Recharts



---

# 👥 User Roles

## Super Admin
- Approve/Reject election creators
- Manage elections
- View logs and analytics
- Override voter locks

## Election Creator
- Create and manage elections
- Add candidates
- Start/Stop elections
- View results

## Voter
- Join elections
- Receive secret voter ID
- Cast anonymous vote
- View results

---

# ✨ Features

## 1. Authentication Module
- User Signup/Login
- Email Verification
- Forgot Password
- Role-Based Authentication
- Session Management
- Protected Routes

---

## 2. Admin Approval Module
- Review election creator requests
- Approve/Reject requests
- Add rejection reason
- Send approval/rejection notifications
- Activity logs

---

## 3. Election Creation Module
- Create election
- Add title & description
- Set election category
- Set:
  - Start date/time
  - End date/time
  - Registration deadline
- Define maximum voters
- Create multiple polls
- Publish election

---

## 4. Candidate Management Module
- Add candidate/member
- Upload candidate photo
- Add designation & manifesto
- Edit/Delete candidate
- View candidate list

---

## 5. Public Landing Page
- Display:
  - Upcoming elections
  - Active elections
  - Completed elections
- Countdown timer
- Search & filter elections
- Mobile responsive UI

---

## 6. Voter Registration Module
- Join election
- Participation confirmation
- Terms acceptance
- Eligibility validation
- Prevent duplicate registration
- Waitlist system

---

## 7. Voter Finalization Module
- Auto-lock when max voters reached
- Freeze voter list
- Prevent late joins
- Admin override logs

---

## 8. Secret ID Generation Module
- Generate unique voter ID
- Example:
```text
POLL-A-0001
```

- Masked display:
```text
****7821
```

- Email secret ID to voter

---

## 9. Voting Module
- Anonymous voting
- One voter = one vote
- Secret ID verification
- Vote confirmation page
- Auto close after timer ends

---

## 10. Live Results Module
- Live vote counting
- Candidate-wise charts
- Winner declaration
- Turnout percentage
- Final result locking

---

## 11. Audit & Transparency Module
- Log every action:
  - Login
  - Vote
  - Approval
  - Edit
- Timestamp logs
- Download logs
- Transparency dashboard

---

## 12. Notification Module
- Email verification
- Approval emails
- Secret ID emails
- Election reminders
- Winner notifications

---

## 13. Security Module
- Row Level Security (RLS)
- Encrypted votes
- CAPTCHA
- Rate limiting
- Input validation
- XSS/SQL Injection prevention

---

## 14. Dashboard Module

### Admin Dashboard
- Total elections
- Active elections
- Total users
- Analytics

### Election Creator Dashboard
- My elections
- Results
- Start/Stop election

### Voter Dashboard
- Joined polls
- Voting status
- Results

---



---



---

# 🗄️ Database Schema Overview

## Main Tables

### Users
- id
- name
- email
- role

### Elections
- id
- title
- description
- status
- start_time
- end_time

### Candidates
- id
- election_id
- name
- photo
- manifesto

### Voters
- id
- election_id
- user_id
- secret_id

### Votes
- id
- candidate_id
- encrypted_vote
- timestamp

### AuditLogs
- id
- action
- user_id
- timestamp

---

# 🔒 Security Features
- JWT Authentication
- Supabase RLS Policies
- Anonymous vote storage
- Duplicate vote prevention
- Secret voter IDs
- Secure route protection

---

# 📱 Responsive Design
This application is fully responsive for:
- Desktop
- Tablet
- Mobile Devices

---

# 📂 Project Structure

```text
src/
│
├── components/
├── pages/
├── layouts/
├── routes/
├── hooks/
├── services/
├── context/
├── utils/
├── assets/
└── supabase/
```

---

# ⚙️ Installation Guide

## Clone Repository



## Navigate to Project

```bash
cd online-election-system
```

## Install Dependencies

```bash
npm install
```

## Run Project

```bash
npm run dev
```

---

# 🌐 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

---

# 🚀 Deployment

## GitHub
Push complete source code to GitHub repository.

## Vercel
Deploy frontend using Vercel.



---



---



---

# 👨‍💻 Developed By
- Maseera Zulfiqar
- FA23-BCS-060
- CS Department
- COMSATS UNIVERSTY ISLAMABD(VEHARI CAMPUS)

---

# 📜 License
This project is developed for academic and educational purposes only.

---

# ⭐ Conclusion
The Secure Online Election Management System demonstrates:
- Full-stack development
- Authentication & Authorization
- Database design
- Real-world security implementation
- Cloud deployment
- Modern frontend development

This project provides a secure, scalable, and transparent digital voting solution.
