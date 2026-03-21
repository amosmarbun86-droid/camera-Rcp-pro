const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let facingMode="environment";
let stream=null;

let currentFilter="none";
let nightMode=false;
let scale=1;

let map;
let marker;

// ================= CAMERA =================
async function startCamera(){

if(stream){
stream.getTracks().forEach(t=>t.stop());
}

stream=await navigator.mediaDevices.getUserMedia({
video:{facingMode},
audio:false
});

video.srcObject=stream;

video.style.display="block";
document.getElementById("openCam").style.display="none";
}

// ================= SWITCH =================
function switchCamera(){
facingMode=facingMode==="user"?"environment":"user";
startCamera();
}

// ================= FILTER =================
function applyFilter(){
const night=nightMode?"brightness(0.5)":"";
video.style.filter=`${currentFilter} ${night}`;
}

function toggleNight(){
nightMode=!nightMode;
applyFilter();
}

function setFilter(type){

const filters={
normal:"none",
vintage:"sepia(0.7)",
cool:"contrast(1.2) saturate(1.5)",
bw:"grayscale(1)"
};

currentFilter=filters[type];
applyFilter();
}

// ================= PHOTO =================
function takePhoto(){

canvas.style.display="block";

canvas.width=video.videoWidth;
canvas.height=video.videoHeight;

ctx.drawImage(video,0,0);

// watermark
const address=document.getElementById("address").innerText;
const time=document.getElementById("time").innerText;

ctx.fillStyle="rgba(0,0,0,0.5)";
ctx.fillRect(0,canvas.height-90,canvas.width,90);

ctx.fillStyle="#fff";
ctx.font="20px Arial";

ctx.fillText(address,20,canvas.height-50);
ctx.fillText(time,20,canvas.height-20);

const link=document.createElement("a");
link.download="RCP_photo.png";
link.href=canvas.toDataURL("image/png");
link.click();

setTimeout(()=>{
ctx.clearRect(0,0,canvas.width,canvas.height);
canvas.style.display="none";
},200);
}

// ================= CLOCK =================
setInterval(()=>{
document.getElementById("time").innerText=
new Date().toLocaleString();
},1000);

// ================= GPS REALTIME =================
navigator.geolocation.watchPosition(async pos=>{

const lat=pos.coords.latitude;
const lng=pos.coords.longitude;

if(!map){
map=L.map("map").setView([lat,lng],15);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
).addTo(map);

marker=L.marker([lat,lng]).addTo(map);

}else{
marker.setLatLng([lat,lng]);
map.setView([lat,lng]);
}

try{
const res=await fetch(
`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
);
const data=await res.json();
document.getElementById("address").innerText=data.display_name;
}catch{
document.getElementById("address").innerText="Location detected";
}

});

// ================= PINCH ZOOM =================
let startDist=0;

video.addEventListener("touchstart",e=>{
if(e.touches.length===2){
startDist=getDistance(e.touches);
}
});

video.addEventListener("touchmove",e=>{
if(e.touches.length===2){

const newDist=getDistance(e.touches);
scale+=(newDist-startDist)*0.002;

scale=Math.min(Math.max(1,scale),3);
video.style.transform=`scale(${scale})`;

startDist=newDist;
}
});

function getDistance(t){
return Math.hypot(
t[0].clientX-t[1].clientX,
t[0].clientY-t[1].clientY
);
}
