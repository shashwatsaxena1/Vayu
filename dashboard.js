const backendURL = "http://localhost:5000";

window.onload = () => {
  loadAQI();
  loadAyush();
};

const user = JSON.parse(localStorage.getItem("user"));
let riskHistory = [];

function risk(aqi) {
  let r = aqi * 10;
  if (user.problem !== "None") r += 20;
  return Math.min(r, r+10);
}

function calculateRisk(aqi, user) {
  let risk = aqi/6 + user.age * 0.5;

  if (user.problem !== "No Breathing Problem") {
    risk += 20;
  }

  risk = Math.min(100, Math.round(risk));
  document.getElementById("riskValue").innerText = risk + "%";
}


function loadAQI() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("User not logged in");
    return;
  }

  fetch(`${backendURL}/aqi?lat=${user.lat}&lon=${user.lon}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("aqiValue").innerText = data.aqi;
      calculateRisk(data.aqi, user);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("aqiValue").innerText = "Error";
    });
}


/* Chart */
const chart = new Chart(riskChart, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Health Risk %",
      data: [],
      borderColor: "#1976D2",
      borderWidth: 2
    }]
  }
});

function loadAyush() {
  fetch(`${backendURL}/ayush`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("ayushList");
      list.innerHTML = "";
      data.remedies.forEach(item => {
        const li = document.createElement("li");
        li.innerText = item;
        list.appendChild(li);
      });
    })
    .catch(() => {
      document.getElementById("ayushList").innerHTML =
        "<li>Failed to load remedies</li>";
    });
}

function updateChart() {
  chart.data.labels.push("Check " + chart.data.labels.length);
  chart.data.datasets[0].data = riskHistory;
  chart.update();
}

/* Prediction */
async function predictFutureAQI() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const res = await fetch("http://localhost:5000/predict");
  const data = await res.json();

  const futureAQI = data.futureAQI * 50; // scale AQI

  let risk = futureAQI/6 + user.age * 0.5;

  if (user.problem !== "No Breathing Problem") {
    risk += 20;
  }

  risk = Math.min(100, Math.round(risk));

  document.getElementById("futureRisk").innerText =
    `Tomorrow risk ~ ${risk}%`;
}

/* Chatbot */
function sendMessage() {
  chatBox.innerHTML += `<p><b>You:</b> ${chatInput.value}</p>`;
  chatBox.innerHTML += `<p><b>VAYU:</b> Failed To Connect Your Assistance.</p>`;
  chatInput.value = "";
}

/* Map */
const map = L.map("map").setView([user.lat, user.lon], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
L.marker([user.lat, user.lon]).addTo(map);

loadAQI();
setInterval(loadAQI, 300000);
