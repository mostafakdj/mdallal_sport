
const style = document.createElement("style");

style.textContent = `
.product{cursor:pointer}

.product-modal{
  position:fixed;
  inset:0;
  background:#F4F4F4;
  z-index:11000;
  overflow-y:auto;
  color:#101010;
  direction:rtl;
}

.product-modal[hidden],
.image-viewer[hidden],
.product-modal [hidden]{
  display:none!important;
}

.detail-header{
  position:sticky;
  top:0;
  background:white;
  padding:15px;
  padding-top:max(15px,env(safe-area-inset-top));
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom:2px solid #D7192D;
  z-index:10;
}

.detail-header button{
  background:none;
  border:none;
  font-size:25px;
  cursor:pointer;
  color:#101010;
}

.detail-container{
  max-width:850px;
  margin:auto;
  padding:15px 15px 45px;
}

.detail-image-box{
  background:white;
  border-radius:15px;
  overflow:hidden;
  text-align:center;
  padding:12px;
}

.detail-image{
  width:100%;
  max-height:500px;
  object-fit:contain;
  cursor:zoom-in;
}

.zoom-hint{
  color:#777;
  font-size:12px;
  padding:12px;
}

.detail-info{
  background:white;
  border-radius:15px;
  padding:20px;
  margin-top:15px;
}

.detail-category{
  color:#777;
  font-size:13px;
}

.detail-name{
  font-size:25px;
  line-height:1.5;
}

.detail-price{
  font-size:23px;
  font-weight:bold;
  color:#967416;
  margin:15px 0;
}

.detail-description{
  line-height:1.9;
  color:#555;
  white-space:pre-wrap;
  overflow-wrap:anywhere;
}

.detail-divider{
  border:0;
  border-top:1px solid #DDD;
  margin:20px 0;
}

.detail-sale{
  background:#F1F3F7;
  border:1px solid #DDD;
  padding:14px;
  border-radius:10px;
  line-height:1.9;
  margin:15px 0;
  font-size:14px;
}

.detail-options{
  margin:20px 0;
}

.detail-options h3{
  font-size:16px;
  margin:0 0 12px;
}

.detail-option-list{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

.detail-option{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  background:white;
  color:#101010;
  border:1px solid #CCC;
  border-radius:9px;
  padding:12px 15px;
  min-width:48px;
  min-height:45px;
  cursor:pointer;
  font-size:14px;
  font-weight:bold;
}

.detail-option.selected{
  border:2px solid #D7192D;
  background:#FFF1F2;
  color:#B7192B;
}

.detail-color-circle{
  width:23px;
  height:23px;
  border-radius:50%;
  border:1px solid #AAA;
  flex-shrink:0;
}

.dozen-details{
  background:#F7F7F7;
  border:1px solid #DDD;
  border-right:4px solid #D7192D;
  border-radius:10px;
  padding:14px;
  margin:15px 0;
}

.dozen-details h3{
  font-size:15px;
  margin:0 0 10px;
}

.dozen-details p{
  color:#444;
  line-height:1.9;
  margin:0;
  white-space:pre-wrap;
  overflow-wrap:anywhere;
}

.detail-add{
  width:100%;
  padding:16px;
  background:#D7192D;
  color:white;
  border:none;
  border-radius:10px;
  font-size:17px;
  font-weight:bold;
  cursor:pointer;
  margin-top:20px;
}

.detail-add:disabled{
  background:#999;
  cursor:not-allowed;
}

.detail-quantity{
  margin-top:15px;
  padding:15px;
  background:#F4F4F4;
  border-radius:10px;
}

.detail-quantity label{
  display:block;
  font-weight:bold;
  margin-bottom:12px;
}

.detail-quantity-controls{
  display:flex;
  align-items:center;
  direction:ltr;
  gap:8px;
}

.detail-quantity-controls button{
  width:45px;
  height:48px;
  flex-shrink:0;
  background:#081321;
  color:white;
  border:none;
  border-radius:8px;
  font-size:23px;
  cursor:pointer;
}

.detail-quantity-controls input{
  flex:1;
  min-width:0;
  width:100%;
  height:48px;
  text-align:center;
  font-size:20px;
  font-weight:bold;
  border:1px solid #CCC;
  border-radius:8px;
  background:white;
  color:#101010;
}

.detail-quantity-hint{
  font-size:12px;
  color:#777;
  margin-top:10px;
}

.detail-total{
  background:#081321;
  color:white;
  padding:15px;
  border-radius:10px;
  margin-top:12px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
}

.detail-total strong{
  font-size:20px;
  color:#FFF;
}

.detail-message{
  font-size:14px;
  line-height:1.8;
  margin:12px 0;
  overflow-wrap:anywhere;
}

.detail-cart-link{
  width:100%;
  padding:13px;
  margin-top:10px;
  background:#081321;
  color:white;
  border:none;
  border-radius:9px;
  cursor:pointer;
  font-weight:bold;
}

.image-viewer{
  position:fixed;
  inset:0;
  background:#000;
  z-index:12000;
  display:flex;
  flex-direction:column;
}

.viewer-toolbar{
  display:flex;
  justify-content:space-between;
  padding:15px;
  padding-top:max(15px,env(safe-area-inset-top));
}

.viewer-toolbar button{
  background:#333;
  color:white;
  border:none;
  border-radius:10px;
  font-size:22px;
  padding:10px 18px;
  cursor:pointer;
}

.viewer-scroll{
  flex:1;
  min-height:0;
  overflow:auto;
  text-align:center;
}

.viewer-image{
  width:100%;
  max-width:none;
  height:auto;
  margin:20px auto;
}

.viewer-hint{
  color:#CCC;
  text-align:center;
  padding:15px;
  font-size:13px;
}
`;

document.head.appendChild(style);

const modal = document.createElement("section");

modal.className = "product-modal";
modal.hidden = true;

modal.setAttribute("role","dialog");
modal.setAttribute("aria-modal","true");
modal.setAttribute("aria-labelledby","detailName");

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

    <div class="detail-sale">

      <strong id="detailSaleUnit"></strong>

      <div id="detailPackSize"></div>

    </div>

    <hr class="detail-divider">

    <h3>تفاصيل المنتج</h3>

    <p id="detailDescription"
      class="detail-description"></p>

    <div id="detailColors"
      class="detail-options" hidden>

      <h3>🎨 اختر اللون المطلوب</h3>

      <div id="detailColorList"
        class="detail-option-list"></div>

    </div>

    <div id="detailDozenColors"
      class="dozen-details" hidden>

      <h3>🎨 الألوان داخل الدزينة</h3>

      <p id="detailDozenColorsText"></p>

    </div>

    <div id="detailSizes"
      class="detail-options" hidden>

      <h3>📏 اختر المقاس المطلوب</h3>

      <div id="detailSizeList"
        class="detail-option-list"></div>

    </div>

    <div id="detailDozenSizes"
      class="dozen-details" hidden>

      <h3>📏 المقاسات داخل الدزينة</h3>

      <p id="detailDozenSizesText"></p>

    </div>

    <button id="detailAdd"
      type="button"
      class="detail-add">

      🛒 إضافة إلى السلة

    </button>

    <div class="detail-quantity">

      <label id="detailQuantityLabel"
        for="detailQuantity">
        الكمية المطلوبة
      </label>

      <div class="detail-quantity-controls">

        <button id="detailMinus"
          type="button"
          aria-label="تقليل الكمية">−</button>

        <input id="detailQuantity"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          value="1"
          aria-label="الكمية المطلوبة">

        <button id="detailPlus"
          type="button"
          aria-label="زيادة الكمية">+</button>

      </div>

      <div class="detail-quantity-hint">
        يمكنك كتابة الكمية المطلوبة يدوياً
      </div>

    </div>

    <div class="detail-total">

      <span>إجمالي عدد القطع</span>

      <strong id="detailTotalPieces">
        1 قطعة
      </strong>

    </div>

    <p id="detailMessage"
      class="detail-message"
      role="status"></p>

    <button id="detailGoCart"
      type="button"
      class="detail-cart-link">

      عرض سلة الطلبات

    </button>

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

let currentProduct = null;

let currentImage = "";

let currentName = "";

let currentPrice = "";

let selectedColor = "";

let selectedSize = "";

let zoom = 1;

let previousOverflow = "";

let previousFocus = null;

let goToCartAfterClose = false;

let adding = false;

const colorMap = {

  "أسود":"#171717",
  "اسود":"#171717",
  "أبيض":"#FFFFFF",
  "ابيض":"#FFFFFF",
  "أحمر":"#D7192D",
  "احمر":"#D7192D",
  "أزرق":"#2455BA",
  "ازرق":"#2455BA",
  "أخضر":"#228B22",
  "اخضر":"#228B22",
  "أصفر":"#F2CD22",
  "اصفر":"#F2CD22",
  "برتقالي":"#FF8000",
  "رمادي":"#808080",
  "رصاصي":"#808080",
  "زهري":"#F38DB7",
  "وردي":"#F38DB7",
  "بنفسجي":"#833AB4",
  "بني":"#795548",
  "بيج":"#D8C3A5",
  "كحلي":"#14213D",
  "زيتي":"#687438",
  "سماوي":"#70C9F2",
  "تركواز":"#19B9B1",
  "ذهبي":"#C9A227",
  "فضي":"#C0C0C0",
  "black":"#171717",
  "white":"#FFFFFF",
  "red":"#D7192D",
  "blue":"#2455BA",
  "green":"#228B22",
  "yellow":"#F2CD22",
  "orange":"#FF8000",
  "gray":"#808080",
  "grey":"#808080",
  "pink":"#F38DB7",
  "purple":"#833AB4",
  "brown":"#795548",
  "navy":"#14213D",
  "beige":"#D8C3A5"

};

function cleanOptions(values){

  if(!Array.isArray(values)) return [];

  return [...new Set(

    values

      .filter(value=>typeof value==="string")

      .map(value=>value.trim())

      .filter(Boolean)

  )];

}

function getProduct(id){

  if(!id) return null;

  if(typeof window.getStoreProduct==="function"){

    return window.getStoreProduct(id) || null;

  }

  if(typeof products!=="undefined" &&
     Array.isArray(products)){

    return products.find(product=>

      String(product.id)===String(id)

    ) || null;

  }

  return null;

}

function isDozen(product){

  return product?.sale_unit==="dozen";

}

function getPiecesPerUnit(product){

  if(!isDozen(product)) return 1;

  const number = Number(product.pieces_per_unit);

  return Number.isSafeInteger(number) &&
    number>0 ? number : 12;

}

function getAvailableUnits(product){

  if(!product) return 0;

  const stock = Number(product.stock);

  if(!Number.isSafeInteger(stock) || stock<0){

    return 0;

  }

  return Math.floor(

    stock / getPiecesPerUnit(product)

  );

}

function getUnitLabel(product){

  return isDozen(product)
    ? "دزينة"
    : "قطعة";

}

function normalizeDigits(value){

  return String(value)

    .replace(/[٠-٩]/g,
      digit=>"٠١٢٣٤٥٦٧٨٩".indexOf(digit))

    .replace(/[۰-۹]/g,
      digit=>"۰۱۲۳۴۵۶۷۸۹".indexOf(digit))

    .trim();

}

function readQuantity(){

  const value = normalizeDigits(

    $("detailQuantity").value

  );

  if(!/^\d+$/.test(value)) return 0;

  const quantity = Number(value);

  return Number.isSafeInteger(quantity) &&
    quantity>0 ? quantity : 0;

}

function showMessage(text,success=false){

  $("detailMessage").textContent = text;

  $("detailMessage").style.color =

    success ? "#168A48" : "#B7192B";

}

function getColorCode(value){

  const normalized =
    value.trim().toLowerCase();

  if(Object.prototype.hasOwnProperty.call(

    colorMap,normalized

  )){

    return colorMap[normalized];

  }

  if(/^#[0-9a-f]{6}$/i.test(normalized)){

    return normalized;

  }

  return "";

}

function renderOptions(type){

  if(!currentProduct) return;

  const color = type==="color";

  const values = cleanOptions(

    color
      ? currentProduct.colors
      : currentProduct.sizes

  );

  const enabled = color

    ? currentProduct.has_colors!==false

    : currentProduct.has_sizes!==false;

  const section = $(color

    ? "detailColors"

    : "detailSizes");

  const list = $(color

    ? "detailColorList"

    : "detailSizeList");

  section.hidden = !enabled || !values.length;

  list.replaceChildren();

  if(section.hidden) return;

  values.forEach(value=>{

    const button =
      document.createElement("button");

    button.type = "button";

    button.className = "detail-option";

    const selected = color

      ? selectedColor===value

      : selectedSize===value;

    button.classList.toggle(
      "selected",selected
    );

    button.setAttribute(
      "aria-pressed",String(selected)
    );

    if(color){

      const code = getColorCode(value);

      if(code){

        const circle =
          document.createElement("span");

        circle.className =
          "detail-color-circle";

        circle.style.background = code;

        button.appendChild(circle);

      }

    }

    const label =
      document.createElement("span");

    label.textContent = value;

    button.appendChild(label);

    button.onclick = ()=>{

      if(color){

        selectedColor = value;

      }else{

        selectedSize = value;

      }

      showMessage("");

      renderOptions(type);

    };

    list.appendChild(button);

  });

}

function renderDozenDetails(){

  if(!currentProduct) return;

  const dozen = isDozen(currentProduct);

  const colors =
    currentProduct.dozen_colors || "";

  const sizes =
    currentProduct.dozen_sizes || "";

  $("detailDozenColors").hidden = !(

    dozen &&

    currentProduct.show_dozen_colors===true &&

    colors.trim()

  );

  $("detailDozenSizes").hidden = !(

    dozen &&

    currentProduct.show_dozen_sizes===true &&

    sizes.trim()

  );

  $("detailDozenColorsText").textContent =
    colors;

  $("detailDozenSizesText").textContent =
    sizes;

}

function renderSaleDetails(){

  if(!currentProduct) return;

  const dozen = isDozen(currentProduct);

  $("detailSaleUnit").textContent = dozen

    ? "📦 طريقة البيع: بالدزينة"

    : "📦 طريقة البيع: بالقطعة";

  $("detailPackSize").hidden = !dozen;

  $("detailPackSize").textContent = dozen

    ? "عدد القطع داخل الدزينة: " +
      getPiecesPerUnit(currentProduct)

    : "";

  $("detailQuantityLabel").textContent = dozen

    ? "عدد الدزينات المطلوبة"

    : "عدد القطع المطلوبة";

  updateTotal();

}

function updateTotal(){

  const quantity = readQuantity();

  const total =

    quantity *

    getPiecesPerUnit(currentProduct);

  $("detailTotalPieces").textContent =

    Number.isSafeInteger(total)

      ? total+" قطعة"

      : "كمية غير صحيحة";

}

function updateAvailability(){

  const latest =
    getProduct(currentProduct?.id);

  const available =

    latest?.available===true &&

    getAvailableUnits(latest)>0;

  $("detailAdd").disabled =
    !available || adding;

  $("detailPlus").disabled = !available;

  $("detailMinus").disabled = !available;

  $("detailQuantity").disabled = !available;

  $("detailStock").textContent = available

    ? "● متوفر في المستودع"

    : "● غير متوفر";

  $("detailStock").style.color = available

    ? "#168A48"

    : "#B7192B";

  $("detailAdd").textContent = adding

    ? "جاري الإضافة..."

    : available

      ? "🛒 إضافة إلى السلة"

      : "المنتج غير متوفر";

}

function openProduct(card){

  if(!modal.hidden) return;

  const id = card.dataset.productId;

  currentProduct = getProduct(id);

  if(!currentProduct){

    if(typeof window.showToast==="function"){

      window.showToast(
        "تعذر تحميل بيانات المنتج."
      );

    }

    return;

  }

  previousFocus = document.activeElement;

  currentName = currentProduct.name || "";

  currentPrice =

    card.querySelector(".price")?.textContent ||

    "";

  const imageUrl =
    currentProduct.image_url || "";

  currentImage =

    typeof imageUrl==="string" &&

    imageUrl.startsWith("https://")

      ? imageUrl

      : "";

  selectedColor = "";

  selectedSize = "";

  $("detailQuantity").value = "1";

  $("detailName").textContent = currentName;

  $("detailCategory").textContent =

    currentProduct.category || "";

  $("detailPrice").textContent =

    currentPrice.trim()

      ? currentPrice+" / "+
        getUnitLabel(currentProduct)

      : "";

  $("detailPrice").hidden =
    !currentPrice.trim();

  $("detailDescription").textContent =

    currentProduct.description ||

    "لا يوجد وصف إضافي.";

  $("detailImageBox").hidden = !currentImage;

  if(currentImage){

    $("detailImage").src = currentImage;

    $("detailImage").alt = currentName;

  }else{

    $("detailImage").removeAttribute("src");

  }

  renderSaleDetails();

  renderOptions("color");

  renderOptions("size");

  renderDozenDetails();

  updateAvailability();

  showMessage("");

  previousOverflow =
    document.body.style.overflow;

  document.body.style.overflow = "hidden";

  modal.hidden = false;

  modal.scrollTop = 0;

  goToCartAfterClose = false;

  history.pushState(

    {productModal:true},

    ""

  );

  $("closeProduct").focus();

}

function hideProduct(){

  viewer.hidden = true;

  modal.hidden = true;

  document.body.style.overflow =
    previousOverflow;

  previousFocus?.focus();

  if(goToCartAfterClose){

    goToCartAfterClose = false;

    if(typeof window.navigate==="function"){

      window.navigate("cart");

    }

  }

}

function closeProduct(){

  if(adding) return;

  if(history.state?.productModal){

    history.back();

  }else{

    hideProduct();

  }

}

$("closeProduct").onclick = closeProduct;

window.addEventListener("popstate",()=>{

  if(!modal.hidden){

    hideProduct();

  }

});

function changeQuantity(direction){

  if(!currentProduct || adding) return;

  const latest = getProduct(currentProduct.id);

  const maximum = getAvailableUnits(latest);

  if(!latest?.available || maximum<1){

    updateAvailability();

    showMessage("المنتج غير متوفر حالياً.");

    return;

  }

  const quantity = readQuantity() || 1;

  $("detailQuantity").value = String(

    Math.min(

      maximum,

      Math.max(1,quantity+direction)

    )

  );

  updateTotal();

  showMessage("");

}

$("detailMinus").onclick = ()=>

  changeQuantity(-1);

$("detailPlus").onclick = ()=>

  changeQuantity(1);

$("detailQuantity").addEventListener(

  "input",()=>{

    updateTotal();

    showMessage("");

  }

);

$("detailAdd").onclick = async ()=>{

  if(!currentProduct || adding) return;

  const latest =
    getProduct(currentProduct.id);

  if(!latest?.available){

    updateAvailability();

    showMessage("المنتج غير متوفر حالياً.");

    return;

  }

  if(

    latest.sale_unit!==currentProduct.sale_unit ||

    getPiecesPerUnit(latest)!==
      getPiecesPerUnit(currentProduct) ||

    latest.dozen_colors!==currentProduct.dozen_colors ||

    latest.dozen_sizes!==currentProduct.dozen_sizes ||

    latest.show_dozen_colors!==
      currentProduct.show_dozen_colors ||

    latest.show_dozen_sizes!==
      currentProduct.show_dozen_sizes

  ){

    currentProduct = latest;

    renderSaleDetails();

    renderDozenDetails();

    renderOptions("color");

    renderOptions("size");

    updateAvailability();

    showMessage(

      "تم تحديث تعبئة المنتج. راجع التفاصيل ثم أضف المنتج مجدداً."

    );

    return;

  }

  const colors = latest.has_colors!==false

    ? cleanOptions(latest.colors)

    : [];

  const sizes = latest.has_sizes!==false

    ? cleanOptions(latest.sizes)

    : [];

  if(colors.length &&
     !colors.includes(selectedColor)){

    currentProduct = latest;

    renderOptions("color");

    showMessage("يرجى اختيار اللون المطلوب.");

    return;

  }

  if(sizes.length &&
     !sizes.includes(selectedSize)){

    currentProduct = latest;

    renderOptions("size");

    showMessage("يرجى اختيار المقاس المطلوب.");

    return;

  }

  const quantity = readQuantity();

  if(quantity<1){

    showMessage("يرجى كتابة كمية صحيحة.");

    return;

  }

  const maximum = getAvailableUnits(latest);

  if(quantity>maximum){

    showMessage(

      "الكمية المطلوبة أكبر من المتاح. الحد المتاح: "+

      maximum+" "+

      getUnitLabel(latest)

    );

    return;

  }

  const piecesPerUnit =
    getPiecesPerUnit(latest);

  const totalPieces =
    quantity * piecesPerUnit;

  if(!Number.isSafeInteger(totalPieces)){

    showMessage("الكمية المطلوبة غير صحيحة.");

    return;

  }

  if(typeof window.addStoreCartItem!=="function"){

    showMessage(

      "يرجى استكمال تحديث ملف المتجر الرئيسي."

    );

    return;

  }

  adding = true;

  updateAvailability();

  try{

    const result =

      await window.addStoreCartItem({

        productId:latest.id,

        color:colors.length
          ? selectedColor
          : "",

        size:sizes.length
          ? selectedSize
          : "",

        quantity:quantity,

        sale_unit:isDozen(latest)
          ? "dozen"
          : "piece",

        unit_label:getUnitLabel(latest),

        pieces_per_unit:piecesPerUnit,

        total_pieces:totalPieces,

        dozen_colors:

          latest.show_dozen_colors

            ? latest.dozen_colors || ""

            : "",

        dozen_sizes:

          latest.show_dozen_sizes

            ? latest.dozen_sizes || ""

            : ""

      });

    if(result?.success!==true){

      showMessage(

        result?.message ||

        "تعذر إضافة المنتج إلى السلة."

      );

      return;

    }

    showMessage(

      "✓ تمت إضافة "+

      quantity+" "+

      getUnitLabel(latest)+

      " إلى السلة، بإجمالي "+

      totalPieces+" قطعة.",

      true

    );

    $("detailQuantity").value = "1";

    updateTotal();

  }catch(error){

    console.error(error);

    showMessage("تعذر إضافة المنتج إلى السلة.");

  }finally{

    adding = false;

    updateAvailability();

  }

};

$("detailGoCart").onclick = ()=>{

  if(adding) return;

  goToCartAfterClose = true;

  closeProduct();

};

function handleCardClick(event){

  if(!(event.target instanceof Element)) return;

  if(event.target.closest(

    "button,a,input,select,textarea"

  )) return;

  const card = event.target.closest(".product");

  if(card){

    openProduct(card);

  }

}

function prepareCards(container){

  container.querySelectorAll(".product")

    .forEach(card=>{

      card.tabIndex = 0;

      card.setAttribute("role","button");

    });

}

function attachProductContainer(container){

  if(!container) return;

  container.addEventListener(

    "click",

    handleCardClick

  );

  container.addEventListener("keydown",event=>{

    if(event.key!=="Enter" &&
       event.key!==" ") return;

    if(!(event.target instanceof Element)) return;

    const card =
      event.target.closest(".product");

    if(card && event.target===card){

      event.preventDefault();

      openProduct(card);

    }

  });

  new MutationObserver(()=>{

    prepareCards(container);

  }).observe(container,{

    childList:true,

    subtree:true

  });

  prepareCards(container);

}

attachProductContainer($("products"));

attachProductContainer(

  $("favoritesProducts") ||

  $("favoritesList") ||

  $("favoritesPage")

);

$("detailImage").onclick = ()=>{

  if(!currentImage) return;

  zoom = 1;

  $("viewerImage").src = currentImage;

  $("viewerImage").style.width = "100%";

  viewer.hidden = false;

};

$("closeViewer").onclick = ()=>{

  viewer.hidden = true;

};

function updateZoom(){

  $("viewerImage").style.width =

    (zoom*100)+"%";

}

$("zoomIn").onclick = ()=>{

  zoom = Math.min(4,zoom+.5);

  updateZoom();

};

$("zoomOut").onclick = ()=>{

  zoom = Math.max(1,zoom-.5);

  updateZoom();

};

$("viewerImage").ondblclick = ()=>{

  zoom = zoom===1 ? 2 : 1;

  updateZoom();

};

document.addEventListener("keydown",event=>{

  if(event.key==="Escape"){

    if(!viewer.hidden){

      viewer.hidden = true;

    }else if(!modal.hidden){

      closeProduct();

    }

  }

});

$("shareProduct").onclick = async ()=>{

  const data = {

    title:currentName,

    text:[

      currentName,

      "MDALLAL SPORTS"

    ].filter(Boolean).join("\n"),

    url:location.origin+location.pathname

  };

  try{

    if(navigator.share){

      await navigator.share(data);

    }else{

      await navigator.clipboard.writeText(

        data.text+"\n"+data.url

      );

      showMessage(

        "تم نسخ معلومات المنتج.",

        true

      );

    }

  }catch(error){

    console.log("Sharing cancelled or failed");

  }

};
