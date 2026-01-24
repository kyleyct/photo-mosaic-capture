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
const downloadAllPhotosBtn = document.getElementById("downloadAllPhotosBtn");
const printOverlayBtn = document.getElementById("printOverlayBtn");
const printOriginalBtn = document.getElementById("printOriginalBtn");
const resetBtn = document.getElementById("resetBtn");

const counterEl = document.getElementById("counter");
const messageEl = document.getElementById("message");
const confirmationEl = document.getElementById("confirmation");
const acceptBtn = document.getElementById("acceptBtn");
const rejectBtn = document.getElementById("rejectBtn");
const capturedPreview = document.getElementById("capturedPreview");
const menuBtn = document.getElementById("menuBtn");
const menuDropdown = document.getElementById("menuDropdown");

let stream = null;
let overlays = [];
let currentIndex = 0;
let photos = []; // 儲存所有被接受的照片
let currentCapturedPhoto = null; // 暫存當前拍攝的照片

// ========== localStorage 功能 ==========
// 從 localStorage 載入資料
function loadFromLocalStorage() {
  const saved = localStorage.getItem('photoMosaicData');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      photos = data.photos || [];
      currentIndex = data.currentIndex || 0;
      overlays = data.overlays || [];
      
      // 更新UI
      counterEl.textContent = `${currentIndex} / ${MAX_PHOTOS}`;
      
      // 如果有照片，重新繪製馬賽克
      if (photos.length > 0) {
        updateMosaicPreview();
      }
    } catch (e) {
      console.error('載入資料失敗:', e);
    }
  }
}

// 儲存到 localStorage
function saveToStorage() {
  const data = {
    photos: photos,
    currentIndex: currentIndex,
    overlays: overlays
  };
  localStorage.setItem('photoMosaicData', JSON.stringify(data));
}

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
        loaded++;
        if (loaded === MAX_PHOTOS) {
          resolve();
        }
      };
      img.onerror = () => {
        console.error(`無法載入 overlay: ${img.src}`);
        reject(new Error(`無法載入 overlay: ${img.src}`));
      };
      overlays.push(img);
    }
  });
}

// ---------- 啟動相機 ----------
startCameraBtn.addEventListener("click", async () => {
  try {
    await loadOverlays();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 }
    });
    video.srcObject = stream;
    await video.play();

    startCameraBtn.disabled = true;
    captureBtn.disabled = false;
    messageEl.textContent = "相機已啟動，可以開始拍照。";
  } catch (err) {
    console.error("相機啟動失敗:", err);
    alert("無法啟動相機或載入 overlay");
  }
});

// ---------- 拍照並顯示確認界面 ----------
120
captureBtn.addEventListener(138
  ("click", () => {
  if (currentIndex >= MAX_PHOTOS) return;

    const w = video.videoWidth;
      const h = video.videoHeight;
        // 繪製影片畫面
          photoCanvas.width = 1800; // 4R 照片橫向寬度 (6英寸 x 300 DPI)118

    photoCanvas.height = 1200; // 4R 照片橫向高度 (4英寸 x 300 DPI)
    
  // 繪製影片畫面，按比例縮放並置中
  const scale = Math.min(1800/w, 1200/h);
  const scaledW = w * scale;
  const scaledH = h * scale;
  const offsetX = (1800 - scaledW) / 2;
  const offsetY = (1200 - scaledH) / 2;
  photoCtx.drawImage(video, offsetX, offsetY, scaledW, scaledH);
  // 繪製 overlay
  photoCtx.globalAlpha = OVERLAY_ALPHA;
  const overlay = overlays[currentIndex];
    const drawW = Math.min(1800, 1200);  // 使用固定的 4R
  const drawH = drawW;
  const dx = (1800 - drawW) / 2;
  const dy = (1200 - drawH) / 2;
  photoCtx.drawImage(overlay, dx, dy, drawW, drawH);
    photoCtx.globalAlpha = 1.0; // 重置透明度

  // 儲存照片數據
  currentCapturedPhoto = photoCanvas.toDataURL("image/jpeg", 0.9);

  // 顯示預覽和確認按鈕
  capturedPreview.src = currentCapturedPhoto;
  confirmationEl.style.display = "block";
  captureBtn.disabled = true;
});

// ---------- 接受照片 ----------
acceptBtn.addEventListener("click", () => {
  photos.push(currentCapturedPhoto);
  currentIndex++;
  counterEl.textContent = `${currentIndex} / ${MAX_PHOTOS}`;

  // 更新馬賽克預覽
  updateMosaicPreview();
    saveToStorage();  // 儲存到 localStorage
  
  // 自動下載和列印照片
  const row = Math.floor((currentIndex - 1) / COLS) + 1;
  const col = ((currentIndex - 1) % COLS) + 1;
  
  // 下載照片
  const a = document.createElement("a");
  a.href = currentCapturedPhoto;
  a.download = `photo-row-${row}-col-${col}.jpg`;
  a.click();
  
  // 自動列印照片
  const printWindow = window.open("", "_blank");
  printWindow.document.write("<html><head><title>列印照片</title>");
  printWindow.document.write("<style>body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; } img { max-width: 100%; max-height: 100%; }</style>");
  printWindow.document.write("</head><body>");
  printWindow.document.write(`<img src="${currentCapturedPhoto}" />`);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);

  // 隱藏確認界面
  confirmationEl.style.display = "none";
  currentCapturedPhoto = null;
    capturedPreview.src = ""; // 清空預覽圖片，顯示視頻

  if (currentIndex >= MAX_PHOTOS) {
    captureBtn.disabled = true;
    buildMosaicBtn.disabled = false;
    messageEl.textContent = "已完成 100 張，可以生產馬賽克。";
      
  // 儲存到 localStorage
  saveToLocalStorage();
  } else {
    captureBtn.disabled = false;
    messageEl.textContent = `已拍攝 ${currentIndex} 張。`;
  }
});

// ---------- 取消照片 ----------
rejectBtn.addEventListener("click", () => {
  // 不儲存照片，重新拍攝
  confirmationEl.style.display = "none";
  currentCapturedPhoto = null;
    capturedPreview.src = ""; // 清空預覽圖片，顯示視頻
  captureBtn.disabled = false;
  messageEl.textContent = "照片已取消，請重新拍攝。";
});

// ---------- 即時更新馬賽克預覽 ----------
function updateMosaicPreview() {
  const cellW = 60; // 每個小格寬度
  const cellH = 60; // 每個小格高度
  mosaicCanvas.width = COLS * cellW;
  mosaicCanvas.height = ROWS * cellH;

  for (let i = 0; i < photos.length; i++) {
    const img = new Image();
    img.onload = () => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      mosaicCtx.drawImage(img, col * cellW, row * cellH, cellW, cellH);
    };
    img.src = photos[i];
  }
}

// ---------- 產生 10×10 馬賽克 ----------
function buildMosaic() {
  const cellW = 200; // 每個小格寬度（更大尺寸用於下載）
  const cellH = 200; // 每個小格高度
  mosaicCanvas.width = COLS * cellW;
  mosaicCanvas.height = ROWS * cellH;

  let drawn = 0;
  for (let i = 0; i < photos.length; i++) {
    const img = new Image();
    img.onload = () => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      mosaicCtx.drawImage(img, col * cellW, row * cellH, cellW, cellH);
      drawn++;
      if (drawn === photos.length) {
        messageEl.textContent = "馬賽克已完成，可下載。";
        downloadMosaicBtn.disabled = false;
        downloadAllPhotosBtn.disabled = false;
        printOverlayBtn.disabled = false;
        printOriginalBtn.disabled = false;
      }
    };
    img.src = photos[i];
  }
}

buildMosaicBtn.addEventListener("click", buildMosaic);

// ---------- 下載馬賽克 ----------
downloadMosaicBtn.addEventListener("click", () => {
  const dataUrl = mosaicCanvas.toDataURL("image/jpeg", 0.9);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "mosaic.jpg";
  a.click();
});

// ---------- 下載所有照片 ----------
downloadAllPhotosBtn.addEventListener("click", () => {
  photos.forEach((photoData, index) => {
    const a = document.createElement("a");
    a.href = photoData;
    const row = Math.floor(index / COLS) + 1;
    const col = (index % COLS) + 1;
    a.download = `photo-row-${row}-col-${col}.jpg`;
    a.click();
  });
  alert("所有照片已開始下載！");
});

// ---------- 列印 Overlay（帶overlay的照片）----------
printOverlayBtn.addEventListener("click", () => {
  const printWindow = window.open("", "_blank");
  printWindow.document.write("<html><head><title>列印照片（含 Overlay）</title>");
  printWindow.document.write("<style>body { margin: 0; } img { width: 100%; height: auto; page-break-after: always; }</style>");
  printWindow.document.write("</head><body>");
  
  photos.forEach((photoData) => {
    printWindow.document.write(`<img src="${photoData}" />`);
  });
  
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
});

// ---------- 列印照片原圖（無overlay）----------
printOriginalBtn.addEventListener("click", () => {
  alert("此功能需要儲存無 overlay 的原始照片。目前版本只儲存了含 overlay 的照片。");
  // 如果需要列印原圖，需要在拍照時額外儲存一份不含 overlay 的照片
});

// ---------- 選單功能 ----------
menuBtn.addEventListener("click", () => {
  menuDropdown.classList.toggle("show");
});

// 點擊選單外部時關閉選單
window.addEventListener("click", (event) => {
  if (!event.target.matches(".btn-menu")) {
    if (menuDropdown.classList.contains("show")) {

      // ---------- 重置所有資料 ----------
resetBtn.addEventListener("click", () => {
  if (confirm("確定要重置所有資料嗎？這將會刪除所有已拍攝的照片。")) {
    // 清除 localStorage
    localStorage.removeItem('photoMosaicData');
    
    // 重置變數
    photos = [];
    currentIndex = 0;
    overlays = [];
    
    // 重置 UI
    counterEl.textContent = '0 / 100';
    messageEl.textContent = '';
    
    // 清空馬賽克預覽
    mosaicCtx.clearRect(0, 0, mosaicCanvas.width, mosaicCanvas.height);
    
    // 重新載入頁面
    location.reload();
  }
});
      menuDropdown.classList.remove("show");
    }
  }
});

// ---------- localStorage 持久化 ----------
function saveToLocalStorage() {
  const data = {
    photos: photos,
    currentIndex: currentIndex
  };
  localStorage.setItem("photoMosaicData", JSON.stringify(data));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem("photoMosaicData");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      photos = data.photos || [];
      currentIndex = data.currentIndex || 0;
      
      // 更新顯示
      counterEl.textContent = `${currentIndex} / ${MAX_PHOTOS}`;
      
      if (currentIndex > 0) {
        messageEl.textContent = `已恢復 ${currentIndex} 張照片。`;
        updateMosaicPreview();
        
        if (currentIndex >= MAX_PHOTOS) {
          buildMosaicBtn.disabled = false;
        }
      }
    } catch (e) {
      console.error("無法載入儲存的數據:", e);
    }
  }
}

// 頁面載入時恢復數據
window.addEventListener("DOMContentLoaded", loadFromLocalStorage);
