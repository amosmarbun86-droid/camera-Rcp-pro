const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let facingMode = "environment";

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode }
  });
  video.srcObject = stream;
}
startCamera();

function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";
  startCamera();
}

function toggleNight() {
  video.style.filter = "brightness(0.5)";
}

setInterval(() => {
  document.getElementById("time").innerText =
    new Date().toLocaleString();
}, 1000);

navigator.geolocation.getCurrentPosition(async pos => {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  document.getElementById("coords").innerText =
    `Lat:${lat} Lng:${lng}`;

  const map = new google.maps.Map(
    document.getElementById("map"),
    { center:{lat,lng}, zoom:15 }
  );

  new google.maps.Marker({
    position:{lat,lng},
    map
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=API_KEY`
  );
  const data = await res.json();

  document.getElementById("address").innerText =
    data.results[0].formatted_address;
});

function takePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video,0,0);

  ctx.fillStyle="yellow";
  ctx.fillText(new Date().toLocaleString(),10,canvas.height-20);

  const img = new Image();
  img.src = "logo.png";

  img.onload = ()=>{
    ctx.drawImage(img,canvas.width-80,canvas.height-80,70,70);

    const link = document.createElement("a");
    link.download="photo.png";
    link.href=canvas.toDataURL();
    link.click();
  }
}
