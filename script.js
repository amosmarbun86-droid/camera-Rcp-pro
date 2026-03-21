const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let facingMode = "environment";
let stream = null;

let currentFilter = "none";
let nightMode = false;
let scale = 1;

// =====================
// CAMERA START
// =====================
async function startCamera() {
  try {

    // stop kamera lama (FIX FREEZE)
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true
    });

    video.srcObject = stream;

  } catch (err) {
    alert("Camera error: " + err.message);
  }
}

startCamera();

// =====================
// SWITCH CAMERA
// =====================
function switchCamera() {
  facingMode =
    facingMode === "user" ? "environment" : "user";
  startCamera();
}

// =====================
// FILTER SYSTEM (PRO)
// =====================
function applyFilter() {
  const night = nightMode ? "brightness(0.5)" : "";
  video.style.filter = `${currentFilter} ${night}`;
}

function toggleNight() {
  nightMode = !nightMode;
  applyFilter();
}

function setFilter(type) {

  const filters = {
    normal: "none",
    vintage: "sepia(0.7)",
    cool: "contrast(1.2) saturate(1.5)",
    bw: "grayscale(1)"
  };

  currentFilter = filters[type] || "none";
  applyFilter();
}

// =====================
// TAKE PHOTO (STABLE)
// =====================
function takePhoto() {

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

  const link = document.createElement("a");
  link.download = "RCP_photo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// =====================
// CLOCK
// =====================
setInterval(() => {
  document.getElementById("time").innerText =
    new Date().toLocaleString();
}, 1000);

// =====================
// GPS REALTIME (UPGRADE)
// =====================
let map;
let marker;

navigator.geolocation.watchPosition(async pos => {

  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  if (!map) {
    map = L.map("map").setView([lat, lng], 15);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    ).addTo(map);

    marker = L.marker([lat, lng]).addTo(map);
  } else {
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng]);
  }

  // alamat otomatis
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );

    const data = await res.json();
    document.getElementById("address").innerText =
      data.display_name;

  } catch {
    document.getElementById("address").innerText =
      "Location detected";
  }

});

// =====================
// PINCH ZOOM MOBILE
// =====================
let startDist = 0;

video.addEventListener("touchstart", e => {
  if (e.touches.length === 2) {
    startDist = getDistance(e.touches);
  }
});

video.addEventListener("touchmove", e => {
  if (e.touches.length === 2) {

    const newDist = getDistance(e.touches);
    scale += (newDist - startDist) * 0.002;

    scale = Math.min(Math.max(1, scale), 3);

    video.style.transform = `scale(${scale})`;

    startDist = newDist;
  }
});

function getDistance(touches) {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );
}
