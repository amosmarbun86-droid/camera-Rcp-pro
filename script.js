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
let map, marker;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// SIDEBAR & UI
function toggleSidebar() { document.getElementById("sidebar").classList.toggle("active"); }
function changeFont(f) { customFont = f; }
function changeFontSize(s) { customFontSize = parseInt(s); }
function setWatermark(t) { customWatermark = t; }
function toggleLocation() { 
    locationOn = !locationOn; 
    document.getElementById("address").style.opacity = locationOn ? "1" : "0";
}
function toggleGrid() {
    const grid = document.getElementById("gridOverlay");
    grid.style.display = (grid.style.display === "none" || grid.style.display === "") ? "block" : "none";
}

// CAMERA START
async function startCamera() {
    if(stream) stream.getTracks().forEach(t => t.stop());
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = stream;
        document.getElementById("openCam").style.display = "none";
        initVoiceControl();
    } catch (err) {
        alert("Gagal mengakses kamera. Pastikan izin diberikan.");
    }
}

function switchCamera() {
    facingMode = facingMode === "user" ? "environment" : "user";
    startCamera();
}

// FILTER LOGIC
function setFilter(type) {
    const filters = {
        normal: "none",
        vintage: "sepia(0.5) contrast(1.1) brightness(0.9)",
        cool: "saturate(1.5) hue-rotate(15deg) brightness(1.1)",
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
    video.style.filter = `${currentFilter} ${nightMode ? 'brightness(1.4) contrast(1.2)' : ''}`;
}

// PHOTO LOGIC
function takePhoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw with current filters
    ctx.filter = video.style.filter;
    ctx.drawImage(video, 0, 0);

    // Watermark Background
    ctx.filter = "none";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, canvas.height - 160, canvas.width, 160);

    // Brand Name
    ctx.fillStyle = "#00ffd5";
    ctx.font = `bold 26px ${customFont}`;
    ctx.fillText(brandName + (customWatermark ? " | " + customWatermark : ""), 30, canvas.height - 110);

    // Info Details
    ctx.fillStyle = "white";
    ctx.font = `${customFontSize}px ${customFont}`;
    const timeStr = new Date().toLocaleString('id-ID');
    const addr = document.getElementById("address").innerText;
    
    if(locationOn) ctx.fillText(addr.length > 70 ? addr.substring(0, 70) + "..." : addr, 30, canvas.height - 75);
    ctx.fillText(`${timeStr} | GPS: ${currentLat}, ${currentLng}`, 30, canvas.height - 45);
    ctx.fillText(`ID: RCP-PHOTO-${photoCounter}`, 30, canvas.height - 15);

    // Branding Logo
    if(brandLogo.complete) ctx.drawImage(brandLogo, canvas.width - 110, canvas.height - 110, 80, 80);

    // Flash Effect
    const flash = document.querySelector(".shutter-flash");
    flash.classList.add("flash-active");
    setTimeout(() => flash.classList.remove("flash-active"), 200);

    // Auto Save
    const link = document.createElement("a");
    link.download = `RCP_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    photoCounter++;
}

// VOICE CONTROL
function initVoiceControl() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Speech) {
        const recognition = new Speech();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.onresult = (event) => {
            const msg = event.results[event.results.length - 1][0].transcript.toLowerCase();
            if (msg.includes("amos foto") || msg.includes("foto")) takePhoto();
        };
        recognition.start();
        document.getElementById("voiceStatus").style.display = "block";
    }
}

// GPS & MAP
navigator.geolocation.watchPosition(async pos => {
    currentLat = pos.coords.latitude.toFixed(6);
    currentLng = pos.coords.longitude.toFixed(6);
    if(!map && L) {
        map = L.map('map').setView([currentLat, currentLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        marker = L.marker([currentLat, currentLng]).addTo(map);
    } else if(marker) {
        marker.setLatLng([currentLat, currentLng]);
        map.setView([currentLat, currentLng]);
    }
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${currentLat}&lon=${currentLng}&format=json`);
        const data = await res.json();
        document.getElementById("address").innerText = data.display_name;
    } catch {}
});

setInterval(() => {
    document.getElementById("time").innerText = new Date().toLocaleString('id-ID');
}, 1000);
