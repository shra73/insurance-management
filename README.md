# 🛡️ Insurance Management Platform

A full-stack Insurance Management Platform built using **Flask**, **React**, and **PostgreSQL**. The system streamlines customer, policy, premium, claim, and document management while providing secure authentication, role-based access control, reporting, and automated email notifications.

---

## 📌 Features

### Authentication
- JWT Authentication
- Secure Login & Registration
- Password Encryption
- Role-Based Access Control (Admin, Agent, Customer)

### Customer Management
- Add Customer
- Update Customer
- Delete Customer
- Search Customers
- Customer Profile

### Policy Management
- Create Policy
- Renew Policy
- Cancel Policy
- Policy Search
- Policy Status Tracking

### Premium Management
- Record Premium Payments
- Outstanding Balance Tracking
- Payment History
- PDF Receipt Generation
- Email Receipts

### Claims Management
- Create Claim
- Claim Status Tracking
- Claim Approval/Rejection
- Upload Supporting Documents

### Document Management
- Upload Documents
- Preview Documents
- Download Documents
- Secure Storage

### Reports
- Customer Reports
- Policy Reports
- Claims Reports
- Premium Reports
- PDF Export
- Excel Export

### Notifications
- Welcome Email
- Policy Creation Email
- Premium Receipt Email
- Claim Status Updates
- Premium Due Reminder
- Policy Expiry Reminder

---

# 🛠 Tech Stack

## Backend

- Python
- Flask
- SQLAlchemy
- Flask-JWT-Extended
- Flask-Mail
- APScheduler

## Frontend

- React
- Vite
- Axios
- React Router
- Tailwind CSS
- React Hook Form
- TanStack Query
- React Toastify

## Database

- PostgreSQL

## Tools

- Git
- GitHub
- Docker
- Postman
- VS Code

---

# 📂 Project Structure

```
insurance-management-platform/

backend/
frontend/
docs/
screenshots/

docker-compose.yml
README.md
LICENSE
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/insurance-management-platform.git
```

Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

flask db upgrade

python app.py
```

Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔐 Environment Variables

Backend

```
DATABASE_URL=

JWT_SECRET_KEY=

MAIL_SERVER=

MAIL_USERNAME=

MAIL_PASSWORD=
```

Frontend

```
VITE_API_URL=http://localhost:5000/api
```

---

# 📊 Modules

- Authentication
- Dashboard
- Customers
- Policies
- Premiums
- Claims
- Documents
- Reports
- Notifications

---

# 📷 Screenshots

Add screenshots here:

- Login
- Dashboard
- Customers
- Policies
- Claims
- Reports

---

# 🚀 Future Enhancements

- SMS Notifications
- Payment Gateway Integration
- AI-based Fraud Detection
- OCR Document Processing
- Mobile Application
- Multi-language Support

---

# 👨‍💻 Author

Shraddha

Computer Science Student

---

# 📄 License

This project is licensed under the MIT License.