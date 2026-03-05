document.addEventListener("DOMContentLoaded", function(){

  const form=document.getElementById("appointmentForm");
  const params=new URLSearchParams(window.location.search);
  const editId=params.get("edit");

  async function fetchAppointments(){
    const res = await fetch("http://127.0.0.1:5000/appointments");
    return await res.json();
  }

  async function saveAppointment(app, method, id=null){

    let url="http://127.0.0.1:5000/appointments";

    if(method==="PUT"){
      url += "/" + id;
    }

    await fetch(url,{
      method: method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(app)
    });
  }

  /* ================= EDIT MODE ================= */

  if(editId){
    fetchAppointments().then(apps=>{
      const app = apps.find(a=>a.id===editId);
      if(app){
        doctorName.value=app.doctorName;
        specialty.value=app.specialty;
        hospital.value=app.hospital;
        date.value=app.date;
        time.value=app.time;
        notes.value=app.notes;
        reminderTiming.value=app.reminderTiming;
        isOnline.checked=app.isOnline;
        meetLink.value=app.meetLink||"";
      }
    });
  }

  /* ================= SAVE ================= */

  form.onsubmit=async function(e){
    e.preventDefault();

    const app={
      id: editId || crypto.randomUUID(),
      doctorName: doctorName.value,
      specialty: specialty.value,
      hospital: hospital.value,
      date: date.value,
      time: time.value,
      notes: notes.value,
      reminderTiming: reminderTiming.value,
      isOnline: isOnline.checked,
      meetLink: meetLink.value,
      createdAt: new Date().toISOString()
    };

    if(editId){
      await saveAppointment(app,"PUT",editId);
    }else{
      await saveAppointment(app,"POST");
    }

    window.location.href="appointments.html";
  };

});