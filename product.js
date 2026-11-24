
const style = document.createElement("style");

style.textContent = `
.product {
  cursor: pointer;
  transition: transform .2s;
}

.product:active {
  transform: scale(.98);
}

.product-modal {
  position: fixed;
  inset: 0;
  background: #F4F4F4;
  z-index: 9999;
  overflow-y: auto;
  color: #101010;
}

.product-modal[hidden],
.image-viewer[hidden] {
  display: none !important;
}

.detail-header {
  position: sticky;
  top: 0;
  background: white;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #C9A227;
  z-index: 10;
}

.detail-header button {
  background: none;
  border: none;
  font-size: 25px;
  cursor: pointer;
  color: #101010;
}

.detail-container {
  max-width: 850px;
  margin: auto;
  padding: 15px;
}

.detail-image-box {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  text-align: center;
  padding: 12px;
}

.detail-image {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  cursor: zoom-in;
}

.zoom-hint {
  color: #777;
  font-size: 12px;
  padding: 12px;
}

.detail-info {
  background: white;
  border-radius: 15px;
  padding: 22px;
  margin-top: 15px;
}

.detail-category {
  color: #777;
  font-size: 13px;
}

.detail-name {
  font-size: 25px;
  line-height: 1.5;
}

.detail-price {
  font-size: 30px;
  font-weight: bold;
  color: #967416;
  margin: 18px 0;
}

.detail-description {
  line-height: 1.9;
  color: #555;
  white-space: pre-wrap;
}

.detail-divider {
  border: 0;
  border-top: 1px solid #DDD;
  margin: 22px 0;
}

.image-viewer {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.viewer-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  padding-top: max(15px, env(safe-area-inset-top));
}

.viewer-toolbar button {
  background: #333;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 22px;
  padding: 10px 18px;
  cursor: pointer;
}

.viewer-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  text-align: center;
}

.viewer-image {
  width: 100%;
  max-width: none;
  height: auto;
  margin: 20px auto;
  transition: width .2s;
}

.viewer-hint {
  color: #CCC;
  text-align: center;
  padding: 15px;
  font-size: 13px;
}
`;

document.head.appendChild(style);

const modal = document.createElement("section");

modal.className = "product-modal";
modal.hidden = true;
modal.setAttribute("role", "dialog");
modal.setAttribute("aria-modal", "true");

modal.innerHTML = `
  <div class="detail-header">

    <button id="closeProduct"
      aria-label="العودة">➜</button>

    <strong>MDALLAL SPORTS</strong>

    <button id="shareProduct"
      aria-label="مشاركة المنتج">↗</button>

  </div>

  <div class="detail-container">

    <div class="detail-image-box"
      id="detailImageBox">

      <img id="detailImage"
        class="detail-image"
        alt="صورة المنتج">

      <div class="zoom-hint">
        🔍 اضغط على الصورة لتكبيرها
      </div>

    </div>

    <div class="detail-info">

      <div id="detailCategory"
        class="detail-category"></div>

      <h1 id="detailName"
        class="detail-name"></h1>

      <div id="detailPrice"
        class="detail-price"></div>

      <span id="detailStock"></span>

      <hr class="detail-divider">

      <h3>تفاصيل المنتج</h3>

      <p id="detailDescription"
        class="detail-description"></p>

    </div>

  </div>
`;

document.body.appendChild(modal);

const viewer = document.createElement("section");

viewer.className = "image-viewer";
viewer.hidden = true;

viewer.innerHTML = `
  <div class="viewer-toolbar">

    <button id="closeViewer"
      aria-label="إغلاق الصورة">✕</button>

    <button id="zoomOut"
      aria-label="تصغير">−</button>

    <button id="zoomIn"
      aria-label="تكبير">+</button>

  </div>

  <div class="viewer-scroll">

    <img id="viewerImage"
      class="viewer-image"
      alt="صورة المنتج المكبرة">

  </div>

  <div class="viewer-hint">
    استخدم + و − لتكبير وتصغير الصورة
  </div>
`;

document.body.appendChild(viewer);

const $ = id => document.getElementById(id);

let currentImage = "";
let currentName = "";
let currentPrice = "";
let zoom = 1;
let previousOverflow = "";
let previousFocus = null;

function openProduct(card) {

  previousFocus = document.activeElement;

  currentName =
    card.querySelector("h3")?.textContent || "";

  currentPrice =
    card.querySelector(".price")?.textContent || "";

  currentImage =
    card.querySelector(".product-image")?.src || "";

  $("detailName").textContent = currentName;

  $("detailPrice").textContent = currentPrice;

  $("detailCategory").textContent =
    card.querySelector(".product-category")
      ?.textContent || "";

  $("detailDescription").textContent =
    card.querySelector(".product-description")
      ?.textContent || "لا يوجد وصف إضافي.";

  const stock = card.querySelector(".stock");

  $("detailStock").textContent =
    stock?.textContent || "";

  $("detailStock").className =
    stock?.className || "stock";

  $("detailImageBox").hidden = !currentImage;

  if (currentImage) {

    $("detailImage").src = currentImage;
    $("detailImage").alt = currentName;

  } else {

    $("detailImage").removeAttribute("src");

  }

  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  modal.hidden = false;
  modal.scrollTop = 0;

  history.pushState(
    { productModal: true },
    ""
  );

  $("closeProduct").focus();

}

function hideProduct() {

  viewer.hidden = true;
  modal.hidden = true;

  document.body.style.overflow =
    previousOverflow;

  previousFocus?.focus();

}

function closeProduct() {

  if (history.state?.productModal) {
    history.back();
  } else {
    hideProduct();
  }

}

$("closeProduct").onclick = closeProduct;

window.addEventListener("popstate", () => {

  if (!modal.hidden) {
    hideProduct();
  }

});

const catalog = $("products");

catalog.addEventListener("click", event => {

  const card = event.target.closest(".product");

  if (card) {
    openProduct(card);
  }

});

function prepareCards() {

  catalog.querySelectorAll(".product")
    .forEach(card => {

      card.tabIndex = 0;
      card.setAttribute("role", "button");

    });

}

new MutationObserver(prepareCards).observe(
  catalog,
  { childList: true }
);

prepareCards();

catalog.addEventListener("keydown", event => {

  if (event.key === "Enter" ||
      event.key === " ") {

    const card = event.target.closest(".product");

    if (card) {

      event.preventDefault();
      openProduct(card);

    }

  }

});

$("detailImage").onclick = () => {

  if (!currentImage) return;

  zoom = 1;

  $("viewerImage").src = currentImage;
  $("viewerImage").style.width = "100%";

  viewer.hidden = false;

};

$("closeViewer").onclick = () => {

  viewer.hidden = true;

};

function updateZoom() {

  $("viewerImage").style.width =
    (zoom * 100) + "%";

}

$("zoomIn").onclick = () => {

  zoom = Math.min(4, zoom + .5);
  updateZoom();

};

$("zoomOut").onclick = () => {

  zoom = Math.max(1, zoom - .5);
  updateZoom();

};

$("viewerImage").ondblclick = () => {

  zoom = zoom === 1 ? 2 : 1;
  updateZoom();

};

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {

    if (!viewer.hidden) {
      viewer.hidden = true;
    } else if (!modal.hidden) {
      closeProduct();
    }

  }

});

$("shareProduct").onclick = async () => {

  const data = {

    title: currentName,

    text:
      currentName + "\n" +
      currentPrice + "\n" +
      "MDALLAL SPORTS",

    url: location.origin + location.pathname

  };

  try {

    if (navigator.share) {

      await navigator.share(data);

    } else {

      await navigator.clipboard.writeText(
        data.text + "\n" + data.url
      );

      alert("تم نسخ معلومات المنتج.");

    }

  } catch (error) {

    console.log("Sharing cancelled");

  }

};
