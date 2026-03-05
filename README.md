# 🩺 Personal Health Tracker

The **Personal Health Tracker** is a web-based health management system designed to help users monitor and manage their daily health activities efficiently. The application integrates three essential healthcare features into a single platform:

1. **Medication Reminder System**
2. **Calorie Tracking System**
3. **Doctor Appointment Scheduler**

This system helps users maintain a healthy lifestyle by reminding them to take medications on time, monitoring daily calorie intake, and managing doctor appointments.

The project uses a **Flask-based backend** to handle APIs, scheduling, and external integrations, while the **frontend is built using HTML, CSS, and JavaScript** to provide an interactive user interface.

The application also integrates external services like **USDA FoodData Central API** for nutrition information and an **SMS Gateway** for sending medication reminders.

---

# 🚀 Features

### 💊 Medication Reminder
- Add medications with dosage and timing
- Automated SMS reminders
- Confirmation link for medication intake
- Daily medication status report

### 🍎 Calorie Tracker
- Automatic calorie detection using USDA API
- Track food intake by meal type
- Daily calorie progress tracking
- 7-day calorie overview chart

### 📅 Appointment Scheduler
- Add doctor appointments
- Update or delete appointments
- Store appointment history
- Organized appointment management

---

# 🧰 Tech Stack

## Frontend
- **HTML** – Structure of the web pages  
- **CSS** – Styling and responsive UI design  
- **JavaScript** – Client-side logic and API communication  

## Backend
- **Flask (Python)** – Backend framework for building REST APIs  
- **APScheduler** – Used for scheduling medication reminders  

## APIs & Services
- **USDA FoodData Central API** – Fetch nutritional information for food items  
- **SMS Gateway** – Sends medication reminder messages to the user's phone  

---

# 🛠️ How To Run This Project

---

# 🔹 Backend Setup (Flask)

## Step 1️⃣ Navigate to Backend Folder

```bash
cd backend
```

---

## Step 2️⃣ Create Virtual Environment

```bash
python -m venv venv
```

---

## Step 3️⃣ Activate Virtual Environment

### On Windows

```bash
venv\Scripts\activate
```

### On Mac/Linux

```bash
source venv/bin/activate
```

---

## Step 4️⃣ Install Required Python Libraries

```bash
pip install flask flask-cors requests apscheduler python-dotenv
```

---

# 🔐 Environment Variable Setup

Inside the **backend folder**, create a file named:

```
.env
```

Add the following variables:

```
SMS_GATEWAY_URL=
DEFAULT_SMS_NUMBER=
SMS_TOKEN=
USDA_API_KEY=
```

---

# 📱 SMS Gateway Setup

To enable medication reminders via SMS:

1. Open **Google Play Store**
2. Download the app **Traccar SMS Gateway**
3. Open the application and configure the SMS gateway
4. Copy the **API Token**
5. Add the token to your `.env` file

Example:

```
SMS_TOKEN=your_sms_token_here
SMS_GATEWAY_URL=your_gateway_url
DEFAULT_SMS_NUMBER=your_phone_number
```

---

# 🍎 USDA API Key Setup

The calorie tracker uses the **USDA FoodData Central API**.

Follow these steps to obtain your API key:

1. Visit the website:

https://fdc.nal.usda.gov/api-key-signup

2. Register and generate your API key
3. Copy the API key
4. Add it inside your `.env` file

Example:

```
USDA_API_KEY=your_api_key_here
```

---

# ▶️ Run Backend Server

Start the Flask backend server:

```bash
python app.py
```

The backend will start running at:

```
http://localhost:5000
```

---

# 🌐 Run Frontend

1. Go to the **frontend folder**
2. Open **home.html**

Recommended method:

Use **VS Code Live Server**

Right click:

```
home.html → Open with Live Server
```

---

# ⚙️ How The System Works

## Medication Reminder Workflow

1. User adds medication details.
2. Medication data is stored in `medications.json`.
3. The scheduler continuously checks reminder times.
4. When the reminder time matches:
   - SMS reminder is sent to the user.
5. The user confirms medication intake using the confirmation link.
6. The system updates medication status.

---

## Calorie Tracker Workflow

1. User enters a food name.
2. Frontend sends a request to the backend.
3. Backend calls the USDA FoodData API.
4. The API returns nutrition data.
5. Calories are automatically filled in the input field.
6. Food is logged and added to the daily calorie tracker.

---

## Appointment Scheduler Workflow

1. User adds appointment details.
2. Appointment data is stored in `appointments.json`.
3. Users can update or delete appointments.
4. The system displays upcoming doctor appointments.

---

# 📁 Project Structure

```
personal-health-tracker
│
├── frontend
│   ├── pages
│   ├── styles
│   └── scripts
│
└── backend
    ├── app.py
    ├── medications.json
    ├── appointments.json
    ├── profile.json
    ├── sent_reminders.json
    ├── active_reminder.json
    └── .env
```

---

# 📌 Data Storage

The system uses **JSON files** for storing application data:

- `medications.json` → Stores medication details
- `appointments.json` → Stores doctor appointments
- `profile.json` → Stores user profile and health information
- `sent_reminders.json` → Tracks sent reminders
- `active_reminder.json` → Tracks active medication confirmation

---

# 🎯 Future Enhancements

- User authentication system
- Mobile application integration
- Cloud database integration
- Health analytics dashboard
- Push notification system
- AI-based health recommendations

---

# 👨‍💻 Author

Developed as part of a **Personal Health Tracker System project** using modern web technologies and Python backend services.
