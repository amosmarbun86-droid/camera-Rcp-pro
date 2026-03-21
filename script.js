const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let facingMode = "environment";

// START CAMERA
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode }
  });
  video.srcObject = stream;
}
startCamera();

// SWITCH CAMERA
function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";
  startCamera();
}

// NIGHT MODE
function toggleNight() {
  if (video.style.filter === "brightness(0.5)") {
    video.style.filter = "none";
  } else {
    video.style.filter = "brightness(0.5)";
  }
}

// TIME
setInterval(() => {
  document.getElementById("time").innerText =
    new Date().toLocaleString();
}, 1000);

// GPS + MAP + ALAMAT (LEAFLET)
navigator.geolocation.getCurrentPosition(async pos => {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  document.getElementById("coords").innerText =
    `Lat: ${lat}, Lng: ${lng}`;

  // MAP
  const map = L.map('map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  L.marker([lat, lng]).addTo(map);

  // AMBIL ALAMAT
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
  const data = await res.json();

  document.getElementById("address").innerText =
    data.display_name || "Alamat tidak ditemukan";
});

// FOTO + WATERMARK
function takePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

  // TEXT
  ctx.fillStyle = "yellow";
  ctx.font = "16px Arial";
  ctx.fillText(new Date().toLocaleString(), 10, canvas.height - 20);

  // LOGO
  const img = new Image();
  img.src = "logo.png";

  img.onload = () => {
    ctx.drawImage(img, canvas.width - 80, canvas.height - 80, 70, 70);

    const link = document.createElement("a");
    link.download = "photo.png";
    link.href = canvas.toDataURL();
    link.click();
  };
}
