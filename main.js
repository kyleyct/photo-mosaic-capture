// main.js
const MAX_PHOTOS = 100;
const COLS = 10;
const ROWS = 10;
const OVERLAY_ALPHA = 0.3; // 透明度（0-1）

const video = document.getElementById("video");
const photoCanvas = document.getElementById("photoCanvas");
const photoCtx = photoCanvas.getContext("2d");

const mosaicCanvas = document.getElementById("mosaicCanvas");
const mosaicCtx = mosaicCanvas.getContext("2d");

const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const buildMosaicBtn = document.getElementById("buildMosaicBtn");
const downloadMosaicBtn = document.getElementById("downloadMosaicBtn");

const counterEl = document.getElementById("counter");
const messageEl = document.getElementById("message");

let stream = null;
let overlays = [];
let currentIndex = 0;
let photos = [];

// ---------- 初始化：載入 100 張 overlay ----------
function loadOverlays() {
  return new Promise((resolve, reject) => {
    let loaded = 0;
    for (let i = 0; i < MAX_PHOTOS; i++) {
      const img = new Image();
      // 檔名依你的實際情況修改：
const row = Math.floor(i / COLS) + 1;
      const col = (i % COLS) + 1;
      img.src = `overlays/row-${row}-column-${col}.png`;

      img.onload = () => {
        
        if (loaded === MAX_PHOTOS) resolve();
      };
      img.onerror = (e) => {
        console.error("載入 overlay 失敗", img.src, e);
        reject(e);
      };

      overlays.push(img);
    }
  });
}

// ---------- 啟動相機 ----------
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    messageEl.textContent = "此裝置或浏覽器不支援相機，請改用 Chrome / Safari。";
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      },
      audio: false
    });

    video.srcObject = stream;

    // 等 video metadata ready，設定 canvas 尺寸
    video.addEventListener(
      "loadedmetadata",
      () => {
        photoCanvas.width = video.videoWidth;
        photoCanvas.height = video.videoHeight;
      },
      { once: true }
    );

    captureBtn.disabled = false;
    messageEl.textContent = "";
  } catch (err) {
    console.error(err);
    messageEl.textContent = "無法啟動相機：" + err.message;
  }
}

// ---------- 拍照並套用目前 overlay ----------
function capturePhoto() {
  if (currentIndex >= MAX_PHOTOS) return;

  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) {
    messageEl.textContent = "相機尚未準備好，請稍候再試。";
    return;
  }

  photoCanvas.width = w;
  photoCanvas.height = h;

  // 1. 畫相機畫面
  photoCtx.clearRect(0, 0, w, h);
  photoCtx.drawImage(video, 0, 0, w, h);

  // 2. 疇 overlay，cover 整個畫面
  const overlay = overlays[currentIndex];
  if (overlay) {
    photoCtx.save();
    photoCtx.globalAlpha = OVERLAY_ALPHA;

    // 用「cover」的方式等比例放大
    const scale = Math.max(w / overlay.width, h / overlay.height);
    const drawW = overlay.width * scale;
    const drawH = overlay.height * scale;
    const dx = (w - drawW) / 2;
    const dy = (h - drawH) / 2;

    photoCtx.drawImage(overlay, dx, dy, drawW, drawH);
    photoCtx.restore();
  }

  // 3. 保存這張圖
  const dataUrl = photoCanvas.toDataURL("image/jpeg", 0.9);
  photos.push(dataUrl);

  currentIndex++;
  counterEl.textContent = `${currentIndex} / ${MAX_PHOTOS}`;

  if (currentIndex >= MAX_PHOTOS) {
    captureBtn.disabled = true;
    buildMosaicBtn.disabled = false;
    messageEl.textContent = "已完成 100 張，可以產生馬賽克。";
  } else {
    messageEl.textContent = "";
  }
}

// ---------- 產生 10×10 馬賽克 ----------
function buildMosaic() {
  if (photos.length < MAX_PHOTOS) {
    messageEl.textContent = "未滿 100 張，暁不能產生馬賽克。";
    return;
  }

  // 設定每格 tile 尺寸（可以微調）
  const tileWidth = 150;
  const tileHeight = 100;

  mosaicCanvas.width = tileWidth * COLS;
  mosaicCanvas.height = tileHeight * ROWS;

  mosaicCtx.fillStyle = "#ffffff";
  mosaicCtx.fillRect(0, 0, mosaicCanvas.width, mosaicCanvas.height);

  let loadedCount = 0;

  photos.forEach((dataUrl, i) => {
    const img = new Image();
    img.onload = () => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;

      mosaicCtx.drawImage(
        img,
        col * tileWidth,
        row * tileHeight,
        tileWidth,
        tileHeight
      );

      loadedCount++;
      if (loadedCount === MAX_PHOTOS) {
        messageEl.textContent = "馬賽克已完成，可下載。";
        downloadMosaicBtn.disabled = false;
      }
    };
    img.src = dataUrl;
  });
}

// ---------- 下載馬賽克 ----------
function downloadMosaic() {
  const link = document.createElement("a");
  link.download = "mosaic.png";
  link.href = mosaicCanvas.toDataURL("image/jpeg", 0.9);
  link.click();
}

// ---------- 綦定事件 ----------
startCameraBtn.addEventListener("click", startCamera);
captureBtn.addEventListener("click", capturePhoto);
buildMosaicBtn.addEventListener("click", buildMosaic);
downloadMosaicBtn.addEventListener("click", downloadMosaic);

// 頁面載入就先載入 overlay
loadOverlays()
  .then(() => {
    messageEl.textContent = "overlay 已載入，可以啟動相機。";
  })
  .catch(() => {
    messageEl.textContent = "overlay 載入失敗，請檢查檔名或路徑。";
  });
