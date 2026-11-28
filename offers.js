import { db } from "./firebase-config.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

const OFFER_KEY = "__offers__";
const OFFER_NAME = "الشروات والخصومات";

let offers = new Map();
let catalogProducts = [];
let showingOffers = false;
let currentDetailId = "";
let pauseUntil = 0;

const style = document.createElement("style");

style.textContent = `

#mdOffersStrip[hidden],
#mdOffersPage[hidden]{
  display:none!important;
}

#mdOffersStrip{
  background:#D7192D;
  color:white;
  padding:14px 10px;
  margin-bottom:15px;
  direction:rtl;
}

.md-offers-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  margin-bottom:14px;
}

.md-offers-header h2{
  margin:0;
  font-size:19px;
  font-weight:900;
  color:white;
}

.md-offers-header button{
  background:#101010;
  color:white;
  border:0;
  padding:10px 14px;
  border-radius:8px;
  font-weight:bold;
  cursor:pointer;
}

#mdOffersTrack{
  display:flex;
  gap:10px;
  overflow-x:auto;
  scroll-snap-type:x mandatory;
  scrollbar-width:none;
  direction:rtl;
}

#mdOffersTrack::-webkit-scrollbar{
  display:none;
}

.md-offer-card{
  position:relative;
  background:#101010;
  color:white;
  border-radius:12px;
  overflow:hidden;
  flex:0 0 clamp(145px,42vw,220px);
  scroll-snap-align:start;
  cursor:pointer;
  min-width:0;
}

.md-offer-image{
  position:relative;
  background:white;
  aspect-ratio:1;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
}

.md-offer-image img{
  width:100%;
  height:100%;
  object-fit:contain;
}

.md-offer-percent{
  position:absolute;
  top:7px;
  right:7px;
  background:#D7192D;
  color:white;
  font-size:18px;
  font-weight:900;
  padding:7px 10px;
  border-radius:7px;
  z-index:2;
  pointer-events:none;
}

.md-offer-info{
  padding:12px;
}

.md-offer-info h3{
  color:white;
  font-size:15px;
  margin:0 0 10px;
  line-height:1.6;
  overflow-wrap:anywhere;
}

.md-offer-button{
  background:#D7192D;
  color:white;
  width:100%;
  border:0;
  padding:11px;
  border-radius:8px;
  font-size:13px;
  font-weight:bold;
  cursor:pointer;
}

#mdOffersCategory{
  background:#101010;
  border:2px solid #D7192D;
  border-radius:12px;
  overflow:hidden;
  padding:0;
  cursor:pointer;
  color:white;
  min-height:150px;
  display:flex;
  flex-direction:column;
}

.md-category-icon{
  flex:1;
  min-height:110px;
  display:flex;
  justify-content:center;
  align-items:center;
  color:#FF4055;
  font-size:65px;
  font-weight:900;
}

.md-category-title{
  background:#D7192D;
  color:white;
  width:100%;
  padding:13px 5px;
  font-size:15px;
  font-weight:bold;
  text-align:center;
}

#mdOffersPage{
  direction:rtl;
  padding:12px 0;
}

.md-offers-page-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom:15px;
}

.md-offers-page-header h2{
  font-size:20px;
  margin:0;
}

.md-offers-page-header button{
  background:#101010;
  color:white;
  padding:10px 15px;
  border:0;
  border-radius:8px;
  cursor:pointer;
}

#mdOffersGrid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}

#mdOffersSearch{
  width:100%;
  padding:13px;
  margin-bottom:15px;
  border:1px solid #CCC;
  border-radius:9px;
  font-size:16px;
  background:white;
  color:#101010;
}

.product.md-has-offer{
  position:relative;
}

#mdDetailOffer{
  display:inline-block;
  background:#D7192D;
  color:white;
  padding:10px 16px;
  border-radius:8px;
  font-size:19px;
  font-weight:900;
  margin:10px 0;
}

@media(min-width:750px){

  #mdOffersGrid{
    grid-template-columns:repeat(4,minmax(0,1fr));
  }

}

`;

document.head.appendChild(style);

const strip = document.createElement("section");

strip.id = "mdOffersStrip";
strip.hidden = true;

strip.innerHTML = `

<div class="md-offers-header">

  <h2>🔥 الشروات والخصومات</h2>

  <button id="mdOffersAll" type="button">
    عرض الكل ‹
  </button>

</div>

<div id="mdOffersTrack"></div>

`;

const header = $("home");

if(header){

  header.after(strip);

}else{

  $("sectionBanner")?.before(strip);

}

const offersPage = document.createElement("section");

offersPage.id = "mdOffersPage";
offersPage.hidden = true;

offersPage.innerHTML = `

<div class="md-offers-page-header">

  <h2>🔥 الشروات والخصومات</h2>

  <button id="mdOffersBack" type="button">
    العودة
  </button>

</div>

<input
  id="mdOffersSearch"
  type="search"
  placeholder="ابحث في الشروات والخصومات...">

<p id="mdOffersCount"></p>

<div id="mdOffersGrid"></div>

`;

$("catalog")?.before(offersPage);

function getOffer(id){

  const data = offers.get(String(id));

  if(!data) return null;

  if(data.offer_active !== true) return null;

  const percent = Number(data.offer_percent);

  if(
    !Number.isInteger(percent) ||
    percent < 1 ||
    percent > 100
  ){

    return null;

  }

  if(data.offer_end){

    const end = Date.parse(data.offer_end);

    if(!Number.isFinite(end) || end <= Date.now()){

      return null;

    }

  }

  return {

    percent,

    featured:data.offer_featured !== false,

    order:Number(data.offer_order) || 0

  };

}

function getOfferProducts(){

  return catalogProducts.filter(product => {

    const deal = getOffer(product.id);

    if(!deal) return false;

    const current =
      window.getStoreProduct?.(product.id);

    return current && current.available === true;

  }).sort((a,b) => {

    return getOffer(a.id).order -
      getOffer(b.id).order;

  });

}

function makeBadge(percent){

  const badge = document.createElement("span");

  badge.className = "md-offer-percent";

  badge.textContent = "خصم " + percent + "%";

  return badge;

}

function openProduct(id){

  currentDetailId = String(id);

  const product =
    window.getStoreProduct?.(id);

  if(!product) return;

  const container = $("products");

  if(!container) return;

  const existing = Array.from(
    container.querySelectorAll(".product")
  ).find(card =>

    String(card.dataset.productId) === String(id)

  );

  if(existing){

    existing.click();

    return;

  }

  const temporary = document.createElement("article");

  temporary.className = "product";

  temporary.dataset.productId = String(id);

  temporary.hidden = true;

  const price = document.createElement("span");

  price.className = "price";

  price.textContent = product.price == null

    ? "السعر عند الاستفسار"

    : product.price + " " +
      (product.currency || "USD");

  temporary.appendChild(price);

  container.appendChild(temporary);

  temporary.click();

  temporary.remove();

}

function makeOfferCard(product){

  const deal = getOffer(product.id);

  const card = document.createElement("article");

  card.className = "md-offer-card";

  const imageBox = document.createElement("div");

  imageBox.className = "md-offer-image";

  const url = product.image_url || product.image || "";

  if(
    typeof url === "string" &&
    url.startsWith("https://")
  ){

    const image = document.createElement("img");

    image.src = url;

    image.alt = product.name || "";

    image.loading = "lazy";

    image.onerror = () => {

      image.remove();

      imageBox.append("📦");

    };

    imageBox.appendChild(image);

  }else{

    imageBox.textContent = "📦";

  }

  imageBox.appendChild(makeBadge(deal.percent));

  const info = document.createElement("div");

  info.className = "md-offer-info";

  const name = document.createElement("h3");

  name.textContent = product.name || "";

  const button = document.createElement("button");

  button.type = "button";

  button.className = "md-offer-button";

  button.textContent = "عرض المنتج";

  info.append(name,button);

  card.append(imageBox,info);

  card.onclick = () => openProduct(product.id);

  return card;

}

let stripSignature = "";

function renderStrip(){

  const track = $("mdOffersTrack");

  const items = getOfferProducts().filter(product =>

    getOffer(product.id).featured

  );

  const home = $("homePage");

  const homeVisible = home &&

    !home.hidden &&

    getComputedStyle(home).display !== "none";

  const isMain = typeof selectedCategory === "undefined"

    || selectedCategory === "الكل";

  strip.hidden =

    !homeVisible ||

    !isMain ||

    showingOffers ||

    !items.length ||

    Boolean($("search")?.value.trim());

  const signature = JSON.stringify(

    items.map(product => [

      product.id,

      product.name,

      product.image_url,

      getOffer(product.id)

    ])

  );

  if(signature === stripSignature) return;

  stripSignature = signature;

  track.replaceChildren();

  items.forEach(product => {

    track.appendChild(makeOfferCard(product));

  });

}

function addCategory(){

  const list = $("categoryList");

  if(!list) return;

  if(
    typeof catalogReady !== "undefined" &&
    !catalogReady
  ) return;

  const isMain =

    typeof selectedCategory === "undefined" ||

    selectedCategory === "الكل";

  const existing = $("mdOffersCategory");

  if(!isMain || showingOffers){

    existing?.remove();

    return;

  }

  if(existing) return;

  const button = document.createElement("button");

  button.id = "mdOffersCategory";

  button.type = "button";

  button.className = "category";

  button.innerHTML = `

    <div class="md-category-icon">%</div>

    <div class="md-category-title">
      الشروات والخصومات
    </div>

  `;

  button.onclick = showOffers;

  list.prepend(button);

}

function renderOffersPage(){

  if(!showingOffers) return;

  const grid = $("mdOffersGrid");

  const search = $("mdOffersSearch")
    .value.trim().toLowerCase();

  const items = getOfferProducts().filter(product =>

    [

      product.name,

      product.category,

      product.description

    ].join(" ").toLowerCase().includes(search)

  );

  $("mdOffersCount").textContent =

    items.length + " منتج";

  grid.replaceChildren();

  if(!items.length){

    const p = document.createElement("p");

    p.textContent = "لا توجد عروض متاحة حالياً.";

    grid.appendChild(p);

    return;

  }

  items.forEach(product => {

    grid.appendChild(makeOfferCard(product));

  });

}

const savedVisibility = new Map();

function showOffers(){

  if(showingOffers) return;

  showingOffers = true;

  savedVisibility.clear();

  [

    "categories",

    "catalog",

    "sectionBanner",

    "search",

    "allFilter",

    "newFilter",

    "backFilter"

  ].forEach(id => {

    const element = $(id);

    if(element){

      savedVisibility.set(element,element.hidden);

      element.hidden = true;

    }

  });

  strip.hidden = true;

  offersPage.hidden = false;

  $("mdOffersSearch").value = "";

  renderOffersPage();

  offersPage.scrollIntoView({

    behavior:"smooth",

    block:"start"

  });

}

function closeOffers(){

  if(!showingOffers) return;

  showingOffers = false;

  offersPage.hidden = true;

  savedVisibility.forEach((hidden,element) => {

    element.hidden = hidden;

  });

  savedVisibility.clear();

  addCategory();

  renderStrip();

}

$("mdOffersAll").onclick = showOffers;

$("mdOffersBack").onclick = closeOffers;

$("mdOffersSearch").oninput = renderOffersPage;

function decorateProducts(){

  document.querySelectorAll(

    ".product[data-product-id]"

  ).forEach(card => {

    const deal = getOffer(card.dataset.productId);

    const product = window.getStoreProduct?.(

      card.dataset.productId

    );

    const badge = card.querySelector(

      ".md-offer-percent"

    );

    if(!deal || !product?.available){

      badge?.remove();

      card.classList.remove("md-has-offer");

      return;

    }

    card.classList.add("md-has-offer");

    const value = "خصم " + deal.percent + "%";

    if(badge){

      if(badge.textContent !== value){

        badge.textContent = value;

      }

    }else{

      card.appendChild(makeBadge(deal.percent));

    }

  });

}

function renderDetailOffer(){

  const modal = document.querySelector(

    ".product-modal"

  );

  const old = $("mdDetailOffer");

  if(!modal || modal.hidden){

    old?.remove();

    return;

  }

  const deal = getOffer(currentDetailId);

  const product = window.getStoreProduct?.(

    currentDetailId

  );

  if(!deal || !product?.available){

    old?.remove();

    return;

  }

  const value = "خصم " + deal.percent + "%";

  if(old){

    if(old.textContent !== value){

      old.textContent = value;

    }

    return;

  }

  const badge = document.createElement("div");

  badge.id = "mdDetailOffer";

  badge.textContent = value;

  $("detailName")?.after(badge);

}

document.addEventListener("click",event => {

  const card = event.target.closest?.(

    ".product[data-product-id]"

  );

  if(card){

    currentDetailId = card.dataset.productId;

  }

},true);

document.addEventListener("keydown",event => {

  if(event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest?.(

    ".product[data-product-id]"

  );

  if(card){

    currentDetailId = card.dataset.productId;

  }

},true);

const originalCatalog = window.setCatalogData;

if(typeof originalCatalog === "function"){

  window.setCatalogData = function(data){

    originalCatalog(data);

    catalogProducts = Array.isArray(data.products)

      ? data.products

      : [];

    refresh();

  };

}

if(typeof products !== "undefined"){

  catalogProducts = products.slice();

}

if(typeof navigate === "function"){

  const originalNavigate = navigate;

  navigate = function(...args){

    closeOffers();

    const result = originalNavigate.apply(this,args);

    refresh();

    return result;

  };

  window.navigate = navigate;

}

function refresh(){

  addCategory();

  renderStrip();

  decorateProducts();

  renderOffersPage();

  renderDetailOffer();

}

let scheduled = false;

function scheduleRefresh(){

  if(scheduled) return;

  scheduled = true;

  requestAnimationFrame(() => {

    scheduled = false;

    addCategory();

    renderStrip();

    decorateProducts();

    renderDetailOffer();

  });

}

const observer = new MutationObserver(

  scheduleRefresh

);

[

  $("categoryList"),

  $("products"),

  $("favoritesProducts"),

  $("favoritesList")

].filter(Boolean).forEach(element => {

  observer.observe(element,{

    childList:true,

    subtree:true

  });

});

if($("homePage")){

  observer.observe($("homePage"),{

    attributes:true,

    attributeFilter:["hidden","style","class"]

  });

}

const modal = document.querySelector(

  ".product-modal"

);

if(modal){

  observer.observe(modal,{

    attributes:true,

    attributeFilter:["hidden"]

  });

}

$("search")?.addEventListener(

  "input",scheduleRefresh

);

onSnapshot(

  query(

    collection(db,"products"),

    where("active","==",true)

  ),

  snapshot => {

    offers = new Map(

      snapshot.docs.map(item => [

        item.id,

        item.data()

      ])

    );

    refresh();

  },

  error => {

    console.error("Offers error:",error);

    offers.clear();

    refresh();

  }

);

const track = $("mdOffersTrack");

[

  "pointerdown",

  "touchstart",

  "wheel",

  "focusin"

].forEach(event => {

  track.addEventListener(event,() => {

    pauseUntil = Date.now() + 8000;

  },{passive:true});

});

setInterval(() => {

  if(

    strip.hidden ||

    document.hidden ||

    Date.now() < pauseUntil ||

    matchMedia("(prefers-reduced-motion: reduce)").matches

  ) return;

  const first = track.firstElementChild;

  if(!first) return;

  const maximum = track.scrollWidth - track.clientWidth;

  if(maximum <= 0) return;

  if(Math.abs(track.scrollLeft) >= maximum - 5){

    track.scrollTo({

      left:0,

      behavior:"smooth"

    });

  }else{

    track.scrollBy({

      left:-(first.offsetWidth + 10),

      behavior:"smooth"

    });

  }

},3000);

let lastOffers = "";

setInterval(() => {

  const signature = JSON.stringify(

    getOfferProducts().map(product => [

      product.id,

      getOffer(product.id)

    ])

  );

  if(signature !== lastOffers){

    lastOffers = signature;

    refresh();

  }

},2000);

refresh();