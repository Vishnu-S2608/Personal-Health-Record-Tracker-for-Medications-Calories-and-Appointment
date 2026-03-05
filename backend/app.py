from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import socket
import requests
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
import uuid
from datetime import datetime
import time
import threading




app = Flask(__name__)
CORS(app)

load_dotenv()

# ==============================
# FILE PATHS
# ==============================

FILE_PATH = "medications.json"
APPOINTMENT_FILE = "appointments.json"
PROFILE_FILE = "profile.json"
SENT_LOG_FILE = "sent_reminders.json"
ACTIVE_REMINDER_FILE = "active_reminder.json"

# ==============================
# ENVIRONMENT VARIABLES
# ==============================

SMS_GATEWAY_URL = os.getenv("SMS_GATEWAY_URL")
DEFAULT_SMS_NUMBER = os.getenv("DEFAULT_SMS_NUMBER")
SMS_TOKEN = os.getenv("SMS_TOKEN")
USDA_API_KEY = os.getenv("USDA_API_KEY")



def initialize_files():
    files = {
        FILE_PATH: [],
        APPOINTMENT_FILE: [],
        PROFILE_FILE: {},
        SENT_LOG_FILE: {},
        ACTIVE_REMINDER_FILE: {}
    }

    for file, default_content in files.items():
        if not os.path.exists(file):
            with open(file, "w") as f:
                json.dump(default_content, f, indent=4)


def read_sent_logs():
    if not os.path.exists(SENT_LOG_FILE):
        return {}
    with open(SENT_LOG_FILE, "r") as f:
        return json.load(f)


def write_sent_logs(data):
    with open(SENT_LOG_FILE, "w") as f:
        json.dump(data, f, indent=4)


def send_sms(message):
    try:
        payload = {
            "to": DEFAULT_SMS_NUMBER,
            "message": message
        }

        headers = {
            "Authorization": os.getenv("SMS_TOKEN")  # 👈 ADD THIS
        }

        response = requests.post(
            SMS_GATEWAY_URL,
            json=payload,
            headers=headers,
            timeout=10
        )

        print("SMS STATUS:", response.status_code)
        print("SMS RESPONSE:", response.text)

    except Exception as e:
        print("SMS ERROR:", e)

import socket

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
    return ip

def build_medication_sms(med):

    confirm_id = str(uuid.uuid4())

    # Save active reminder
    with open(ACTIVE_REMINDER_FILE, "w") as f:
        json.dump({
            "confirm_id": confirm_id,
            "med_id": med["id"],
            "status": "waiting",
            "sent_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }, f)


    
    confirm_link = f"http://{get_local_ip()}:5000/confirm/{confirm_id}"
    # ⚠️ Replace with YOUR laptop local IP

    return f"""Medication Reminder

Tablet: {med['name']}
Dosage: {med['dosage']}
Take {med['foodTiming']} food

Confirm taken:
{confirm_link}
"""



#report logic
def generate_daily_report():
    today = datetime.now().strftime("%Y-%m-%d")
    medications = read_data()

    total = 0
    taken = 0
    missed = 0
    pending = 0

    for med in medications:
        if "status" in med and today in med["status"]:
            total += 1
            status = med["status"][today]

            if status == "taken":
                taken += 1
            elif status == "missed":
                missed += 1
            elif status == "pending":
                pending += 1

    report_message = f"""
Daily Medication Report ({today})

Total: {total}
Taken: {taken}
Missed: {missed}
Pending: {pending}

Stay consistent and take care 💊
"""

    send_sms(report_message)


def daily_report_scheduler():
    while True:
        now = datetime.now()

        # Send at 21:00 (9 PM)
        if now.hour == 14 and now.minute == 52:
            generate_daily_report()
            time.sleep(60)  # avoid duplicate send in same minute

        time.sleep(30)


#=============================

# Start scheduler thread
threading.Thread(target=daily_report_scheduler, daemon=True).start()

# ==============================
# BACKGROUND REMINDER CHECKER
# ==============================

def check_medication_reminders():
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")

    medications = read_data()
    sent_logs = read_sent_logs()

    for med in medications:

        # Convert reminderTime to datetime
        reminder_str = med.get("reminderTime")
        if not reminder_str:
            continue

        reminder_time = datetime.strptime(reminder_str, "%H:%M").time()

        # Check if same hour and minute
        if (
            now.hour == reminder_time.hour and
            now.minute == reminder_time.minute and
            med.get("startDate") <= today <= med.get("endDate")
        ):

            reminder_key = f"{med['id']}-{today}-{reminder_str}"

            if reminder_key not in sent_logs:

                sms_text = build_medication_sms(med)
                send_sms(sms_text)

                # ✅ SET STATUS AS PENDING HERE
                today = datetime.now().strftime("%Y-%m-%d")

                medications = read_data()

                for m in medications:
                    if m["id"] == med["id"]:

                        if "status" not in m:
                            m["status"] = {}

                        m["status"][today] = "pending"
                        break

                write_data(medications)

                sent_logs[reminder_key] = True
                write_sent_logs(sent_logs)



# Start scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(check_medication_reminders, "interval", seconds=5, max_instances=1)
scheduler.start()


@app.route("/confirm/<confirm_id>", methods=["GET"])
def confirm_medication(confirm_id):

    if not os.path.exists(ACTIVE_REMINDER_FILE):
        return "No active reminder."

    with open(ACTIVE_REMINDER_FILE, "r") as f:
        reminder = json.load(f)

    if reminder["confirm_id"] != confirm_id:
        return "Invalid confirmation link."

    med_id = reminder["med_id"]
    today = datetime.now().strftime("%Y-%m-%d")

    medications = read_data()

    for med in medications:
        if med["id"] == med_id:

            if "status" not in med:
                med["status"] = {}

            med["status"][today] = "taken"

            break

    write_data(medications)

    return """
    <h2>✅ Medication Confirmed as Taken</h2>
    <p>You may close this page.</p>
    """


def check_confirmation_timeout():

    if not os.path.exists(ACTIVE_REMINDER_FILE):
        return

    with open(ACTIVE_REMINDER_FILE, "r") as f:
        reminder = json.load(f)

    if reminder["status"] == "waiting":

        sent_time = datetime.strptime(reminder["sent_time"], "%Y-%m-%d %H:%M:%S")

        if (datetime.now() - sent_time).seconds > 30:
            reminder["status"] = "pending"

            with open(ACTIVE_REMINDER_FILE, "w") as f:
                json.dump(reminder, f)


@app.route("/reminder-status", methods=["GET"])
def get_reminder_status():

    if not os.path.exists(ACTIVE_REMINDER_FILE):
        return jsonify({"status": None})

    with open(ACTIVE_REMINDER_FILE, "r") as f:
        return jsonify(json.load(f))
    
scheduler.add_job(check_confirmation_timeout, "interval", seconds=10, max_instances=1)
# ==============================
# APPOINTMENTS BACKEND
# ==============================

def read_appointments():
    if not os.path.exists(APPOINTMENT_FILE):
        return []
    with open(APPOINTMENT_FILE, "r") as f:
        return json.load(f)


def write_appointments(data):
    with open(APPOINTMENT_FILE, "w") as f:
        json.dump(data, f, indent=4)


@app.route("/appointments", methods=["GET"])
def get_appointments():
    return jsonify(read_appointments())


@app.route("/appointments", methods=["POST"])
def add_appointment():
    data = read_appointments()
    new_app = request.json
    data.append(new_app)
    write_appointments(data)
    return jsonify({"message": "Appointment added"}), 201


@app.route("/appointments/<string:app_id>", methods=["PUT"])
def update_appointment(app_id):
    data = read_appointments()
    for i, app_item in enumerate(data):
        if app_item["id"] == app_id:
            data[i] = request.json
            break
    write_appointments(data)
    return jsonify({"message": "Appointment updated"})


@app.route("/appointments/<string:app_id>", methods=["DELETE"])
def delete_appointment(app_id):
    data = read_appointments()
    data = [a for a in data if a["id"] != app_id]
    write_appointments(data)
    return jsonify({"message": "Appointment deleted"})


# ==============================
# PROFILE BACKEND
# ==============================

def read_profile():
    if not os.path.exists(PROFILE_FILE):
        return {}
    with open(PROFILE_FILE, "r") as f:
        return json.load(f)


def write_profile(data):
    with open(PROFILE_FILE, "w") as f:
        json.dump(data, f, indent=4)


@app.route("/api/profile", methods=["GET"])
def get_profile():
    return jsonify(read_profile())


@app.route("/api/profile", methods=["POST"])
def save_profile():
    profile_data = request.json
    write_profile(profile_data)
    return jsonify({"message": "Profile saved successfully"}), 200


# ==============================
# USDA NUTRITION API BACKEND
# ==============================

USDA_API_KEY = os.getenv("USDA_API_KEY")


@app.route("/api/nutrition", methods=["POST"])
def get_nutrition():

    data = request.json
    food_query = data.get("food")

    if not food_query:
        return jsonify({"error": "No food provided"}), 400

    try:
        # Search food
        search_url = "https://api.nal.usda.gov/fdc/v1/foods/search"

        search_response = requests.post(
            search_url,
            params={"api_key": USDA_API_KEY},
            json={
                "query": food_query,
                "pageSize": 1
            }
        )

        search_data = search_response.json()

        if not search_data.get("foods"):
            return jsonify({"calories": 0})

        food_item = search_data["foods"][0]

        calories = 0

        for nutrient in food_item.get("foodNutrients", []):
            # Nutrient ID 1008 = Energy (kcal)
            if nutrient.get("nutrientId") == 1008:
                calories = nutrient.get("value", 0)
                break

        return jsonify({"calories": calories})

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ==============================
# MEDICATIONS BACKEND
# ==============================

def read_data():
    if not os.path.exists(FILE_PATH):
        return []
    with open(FILE_PATH, "r") as f:
        return json.load(f)


def write_data(data):
    with open(FILE_PATH, "w") as f:
        json.dump(data, f, indent=4)


@app.route("/medications", methods=["GET"])
def get_medications():
    return jsonify(read_data())


@app.route("/medications", methods=["POST"])
def add_medication():
    data = read_data()
    new_med = request.json
    data.append(new_med)
    write_data(data)
    return jsonify({"message": "Medication added"}), 201


@app.route("/medications/<int:med_id>", methods=["PUT"])
def update_medication(med_id):
    data = read_data()
    for i, med in enumerate(data):
        if med["id"] == med_id:
            data[i] = request.json
            break
    write_data(data)
    return jsonify({"message": "Updated"})


@app.route("/medications/<int:med_id>", methods=["DELETE"])
def delete_medication(med_id):
    data = read_data()
    data = [med for med in data if med["id"] != med_id]
    write_data(data)
    return jsonify({"message": "Deleted"})

initialize_files()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)