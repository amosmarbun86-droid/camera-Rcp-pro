const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let facingMode = "environment";
let currentFilter = "none";

// CAMERA
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: true
  });
  video.srcObject = stream;
}
startCamera();

// SWITCH
function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";
  startCamera();
}

// NIGHT
function toggleNight() {
  video.style.filter =
    video.style.filter === "brightness(0.5)" ? "none" : "brightness(0.5)";
}

// FILTER
function setFilter(type) {
  const filters = {
    normal: "none",
    vintage: "sepia(0.7)",
    cool: "contrast(1.2) saturate(1.5)",
    bw: "grayscale(1)"
  };

  currentFilter = filters[type];
  video.style.filter = currentFilter;
}

// TIME
setInterval(() => {
  document.getElementById("time").innerText =
    new Date().toLocaleString();
}, 1000);

// MAP + GPS
navigator.geolocation.getCurrentPosition(async pos => {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  document.getElementById("coords").innerText =
    `Lat: ${lat}, Lng: ${lng}`;

  const map = L.map('map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(map);

  L.marker([lat, lng]).addTo(map);

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
  const data = await res.json();

  document.getElementById("address").innerText =
    data.display_name;
});

// ZOOM
document.getElementById("zoom").addEventListener("input", e => {
  video.style.transform = `scale(${e.target.value})`;
});

// FOTO
function takePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0);
  ctx.filter = "none";

  ctx.fillStyle = "yellow";
  ctx.fillText(new Date().toLocaleString(), 10, canvas.height - 20);

  const img = new Image();
  img.src = "logo.png";

  img.onload = () => {
    ctx.drawImage(img, canvas.width - 80, canvas.height - 80, 70, 70);

    const link = document.createElement("a");
    link.download = "CameraRCP_" + Date.now() + ".png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // FLASH
  const flash = document.createElement("div");
  flash.className = "flash";
  document.querySelector(".app").appendChild(flash);
  setTimeout(() => flash.remove(), 300);
}

// VIDEO
let recorder;
let chunks = [];
let recording = false;

function toggleRecord() {
  if (!recording) {
    recorder = new MediaRecorder(video.srcObject);

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "VideoRCP_" + Date.now() + ".webm";
      a.click();

      chunks = [];
    };

    recorder.start();
    recording = true;
  } else {
    recorder.stop();
    recording = false;
  }
}
