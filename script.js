// Konfigurasi Brand
const brandName = "AMOS RCP86 PRO";
const brandLogo = new Image();
brandLogo.src = "logo.png";

let photoCounter = 1;
let currentLat = "0.00", currentLng = "0.00";
let customFont = "Inter";
let customFontSize = 18;
let customWatermark = "";
let locationOn = true;
let facingMode = "environment";
let stream = null;
let currentFilter = "none";
let nightMode = false;
let scale = 1;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Sidebar
function toggleSidebar() { document.getElementById("sidebar").classList.toggle("active"); }
function changeFont(f) { customFont = f; }
function changeFontSize(s) { customFontSize = parseInt(s); }
function setWatermark(t) { customWatermark = t; }
function toggleLocation() { 
    locationOn = !locationOn; 
    document.getElementById("address").style.opacity = locationOn ? "1" : "0";
}

// Start Camera
async function startCamera() {
    if(stream) stream.getTracks().forEach(t => t.stop());
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = stream;
        document.getElementById("openCam").style.display = "none";
    } catch (err) {
        alert("Gagal akses kamera: " + err);
    }
}

function switchCamera() {
    facingMode = facingMode === "user" ? "environment" : "user";
    startCamera();
}

function setFilter(type) {
    const filters = {
        normal: "none",
        vintage: "sepia(0.6) contrast(1.1)",
        cool: "saturate(1.4) hue-rotate(10deg)",
        bw: "grayscale(1) contrast(1.2)"
    };
    currentFilter = filters[type];
    applyFilters();
}

function toggleNight() {
    nightMode = !nightMode;
    applyFilters();
}

function applyFilters() {
    video.style.filter = `${currentFilter} ${nightMode ? 'brightness(0.6) contrast(1.5)' : ''}`;
}

// Take Photo
function takePhoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.filter = video.style.filter;
    ctx.drawImage(video, 0, 0);

    // Watermark Background
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, canvas.height - 160, canvas.width, 160);

    // Teks Watermark
    ctx.filter = "none";
    ctx.fillStyle = "#00ffd5";
    ctx.font = `bold 26px ${customFont}`;
    ctx.fillText(brandName, 30, canvas.height - 110);

    ctx.fillStyle = "white";
    ctx.font = `${customFontSize}px ${customFont}`;
    const timeStr = new Date().toLocaleString('id-ID');
    const addrStr = document.getElementById("address").innerText;
    
    if(locationOn) ctx.fillText(addrStr.substring(0, 60) + "...", 30, canvas.height - 75);
    ctx.fillText(timeStr, 30, canvas.height - 45);
    ctx.fillText(`GPS: ${currentLat}, ${currentLng} | ID: RCP-${photoCounter}`, 30, canvas.height - 15);

    // Logo Brand
    ctx.drawImage(brandLogo, canvas.width - 110, canvas.height - 110, 80, 80);

    // Flash Effect
    const flash = document.querySelector(".shutter-flash");
    flash.classList.add("flash-active");
    setTimeout(() => flash.classList.remove("flash-active"), 200);

    // Download
    const link = document.createElement("a");
    link.download = `RCP86_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    photoCounter++;
}

// GPS & Map
let map, marker;
navigator.geolocation.watchPosition(async pos => {
    currentLat = pos.coords.latitude.toFixed(6);
    currentLng = pos.coords.longitude.toFixed(6);
    
    if(!map) {
        map = L.map('map').setView([currentLat, currentLng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        marker = L.marker([currentLat, currentLng]).addTo(map);
    } else {
        marker.setLatLng([currentLat, currentLng]);
        map.setView([currentLat, currentLng]);
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${currentLat}&lon=${currentLng}&format=json`);
        const data = await res.json();
        document.getElementById("address").innerText = data.display_name;
    } catch { }
});

// Clock update
setInterval(() => {
    document.getElementById("time").innerText = new Date().toLocaleString('id-ID');
}, 1000);
