// ================= BRAND CONFIG =================
const brandLogo = new Image();
brandLogo.src = "logo.png";

const brandName = "AMOS RCP86";

let photoCounter = 1;
let currentLat = "";
let currentLng = "";

const deviceName = navigator.userAgent;

// ================= SETTINGS =================
let customFont = "Arial";
let customFontSize = 18;
let customWatermark = "";
let watermarkPosition = "bottom";
let locationOn = true;

// ================= ELEMENT =================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let facingMode = "environment";
let stream = null;

let currentFilter = "none";
let nightMode = false;
let scale = 1;

let map;
let marker;

// ================= SIDEBAR =================
function toggleSidebar(){
  document.getElementById("sidebar").classList.toggle("active");
}

function changeFont(font){ customFont = font; }
function changeFontSize(size){ customFontSize = size; }
function setWatermark(text){ customWatermark = text; }
function setWatermarkPosition(pos){ watermarkPosition = pos; }

function toggleLocation(){
  locationOn = !locationOn;
  document.getElementById("address").style.display =
    locationOn ? "block":"none";
}

// ================= CAMERA =================
async function startCamera(){

  if(stream){
    stream.getTracks().forEach(t => t.stop());
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video:{facingMode},
    audio:false
  });

  video.srcObject = stream;
  video.style.display = "block";
  document.getElementById("openCam").style.display = "none";
}

// ================= SWITCH =================
function switchCamera(){
  facingMode = facingMode === "user" ? "environment" : "user";
  startCamera();
}

// ================= FILTER =================
function applyFilter(){
  const night = nightMode ? "brightness(0.5)" : "";
  video.style.filter = `${currentFilter} ${night}`;
}

function toggleNight(){
  nightMode = !nightMode;
  applyFilter();
}

function setFilter(type){
  const filters = {
    normal:"none",
    vintage:"sepia(0.7)",
    cool:"contrast(1.2) saturate(1.5)",
    bw:"grayscale(1)"
  };
  currentFilter = filters[type];
  applyFilter();
}

// ================= BACK TO CAMERA =================
function backToCamera(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  canvas.style.display = "none";
}

// ================= PHOTO PRO MAX =================
function takePhoto(){

  // ukuran canvas
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.style.display = "block";

  // gambar video
  ctx.drawImage(video,0,0);

  // panel bawah
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0,canvas.height-150,canvas.width,150);

  const address = document.getElementById("address").innerText;
  const time = document.getElementById("time").innerText;

  const photoID = "IMG-" + String(photoCounter).padStart(4,"0");

  // BRAND
  ctx.fillStyle = "#00ffd5";
  ctx.font = `bold 24px ${customFont}`;
  ctx.textAlign = "left";
  ctx.fillText(brandName,20,canvas.height-115);

  // INFO
  ctx.fillStyle = "#ffffff";
  ctx.font = `${customFontSize}px ${customFont}`;

  if(locationOn){
    ctx.fillText(address,20,canvas.height-85);
  }

  ctx.fillText(time,20,canvas.height-60);
  ctx.fillText(`GPS: ${currentLat}, ${currentLng}`,20,canvas.height-35);
  ctx.fillText(photoID,20,canvas.height-10);

  // DEVICE
  ctx.textAlign = "right";
  ctx.fillText(deviceName.substring(0,35),canvas.width-20,canvas.height-10);

  // LOGO
  const logoSize = 90;
  ctx.drawImage(
    brandLogo,
    canvas.width-logoSize-20,
    canvas.height-logoSize-20,
    logoSize,
    logoSize
  );

  // CUSTOM WATERMARK
  if(customWatermark){
    ctx.fillStyle = "yellow";
    ctx.textAlign = "center";

    let y = watermarkPosition === "top" ? 40 : canvas.height - 160;
    ctx.fillText(customWatermark,canvas.width/2,y);
  }

  // 🔥 SHUTTER EFFECT
  const box = document.querySelector(".camera-box");
  box.classList.add("flash");
  setTimeout(()=>box.classList.remove("flash"),150);

  // DOWNLOAD
  const link = document.createElement("a");
  link.download = `${photoID}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();

  photoCounter++;

  // 🔥 AUTO BALIK KE KAMERA (SUPER CEPAT)
  setTimeout(() => {
    backToCamera();
  }, 80);
}

// ================= CLOCK =================
setInterval(()=>{
  document.getElementById("time").innerText =
    new Date().toLocaleString();
},1000);

// ================= GPS =================
navigator.geolocation.watchPosition(async pos=>{

  currentLat = pos.coords.latitude.toFixed(6);
  currentLng = pos.coords.longitude.toFixed(6);

  if(!map){
    map = L.map("map").setView([currentLat,currentLng],15);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    ).addTo(map);

    marker = L.marker([currentLat,currentLng]).addTo(map);
  }else{
    marker.setLatLng([currentLat,currentLng]);
    map.setView([currentLat,currentLng]);
  }

  try{
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${currentLat}&lon=${currentLng}&format=json`
    );
    const data = await res.json();
    document.getElementById("address").innerText = data.display_name;
  }catch{
    document.getElementById("address").innerText = "Location detected";
  }

});

// ================= PINCH ZOOM =================
let startDist = 0;

video.addEventListener("touchstart",e=>{
  if(e.touches.length === 2){
    startDist = getDistance(e.touches);
  }
});

video.addEventListener("touchmove",e=>{
  if(e.touches.length === 2){
    const newDist = getDistance(e.touches);
    scale += (newDist - startDist) * 0.002;

    scale = Math.min(Math.max(1,scale),3);
    video.style.transform = `scale(${scale})`;

    startDist = newDist;
  }
});

function getDistance(t){
  return Math.hypot(
    t[0].clientX - t[1].clientX,
    t[0].clientY - t[1].clientY
  );
}
