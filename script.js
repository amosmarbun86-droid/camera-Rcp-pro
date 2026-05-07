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

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Sidebar & Settings
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
    grid.style.display = grid.style.display === "none" ? "block" : "none";
}

// Camera Logic
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
        alert("Akses kamera ditolak.");
    }
}

function switchCamera() {
    facingMode = facingMode === "user" ? "environment" : "user";
    startCamera();
}

// Filters
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

// Photo Action
function takePhoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.filter = video.style.filter;
    ctx.drawImage(video, 0, 0);

    // Watermark
    ctx.filter = "none";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

    ctx.fillStyle = "#00ffd5";
    ctx.font = `bold 24px ${customFont}`;
    ctx.fillText(brandName + (customWatermark ? " | " + customWatermark : ""), 30, canvas.height - 100);

    ctx.fillStyle = "white";
    ctx.font = `${customFontSize}px ${customFont}`;
    const timeStr = new Date().toLocaleString('id-ID');
    if(locationOn) ctx.fillText(document.getElementById("address").innerText, 30, canvas.height - 65);
    ctx.fillText(`${timeStr} | GPS: ${currentLat}, ${currentLng}`, 30, canvas.height - 35);
    ctx.fillText(`ID: RCP-${photoCounter}`, 30, canvas.height - 10);

    ctx.drawImage(brandLogo, canvas.width - 100, canvas.height - 100, 70, 70);

    // Flash
    const flash = document.querySelector(".shutter-flash");
    flash.classList.add("flash-active");
    setTimeout(() => flash.classList.remove("flash-active"), 200);

    // Download
    const link = document.createElement("a");
    link.download = `RCP_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    photoCounter++;
}

// Voice Command
function initVoiceControl() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Speech) {
        const recognition = new Speech();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.onresult = (event) => {
            const msg = event.results[event.results.length - 1][0].transcript.toLowerCase();
            if (msg.includes("amos foto") || msg.includes("capture")) takePhoto();
        };
        recognition.start();
    }
}

// GPS
let map, marker;
navigator.geolocation.watchPosition(async pos => {
    currentLat = pos.coords.latitude.toFixed(6);
    currentLng = pos.coords.longitude.toFixed(6);
    if(!map) {
        map = L.map('map').setView([currentLat, currentLng], 15);
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
    } catch {}
});

setInterval(() => {
    document.getElementById("time").innerText = new Date().toLocaleString('id-ID');
}, 1000);
