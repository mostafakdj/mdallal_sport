import { db, auth } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const ADMIN_UID =
  "vAwEHEC8iHNvHnLsDSWUORZM4kv2";

const $ = id => document.getElementById(id);

let products = [];

let unsubscribe = null;

let saving = false;

const style = document.createElement("style");

style.textContent = `

#adminOffers{
  background:#081321;
  border:1px solid #D7192D;
  border-radius:12px;
  overflow:hidden;
  margin:18px 0;
  color:white;
}

#adminOffers summary{
  background:#D7192D;
  color:white;
  padding:17px;
  font-size:18px;
  font-weight:bold;
  cursor:pointer;
}

#adminOffers .offer-admin-content{
  padding:16px;
}

#adminOffers label{
  color:white;
}

#adminOffers input,
#adminOffers select{
  background:white;
  color:#101010;
  border:1px solid #DDD;
}

#adminOffers input[type="checkbox"]{
  accent-color:#D7192D;
}

#offerPreview{
  background:#101010;
  border:2px solid #D7192D;
  border-radius:10px;
  color:#FF4055;
  font-size:30px;
  font-weight:900;
  padding:20px;
  text-align:center;
  margin:12px 0;
}

#offerQuickButtons{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-bottom:15px;
}

#offerQuickButtons button{
  background:#D7192D;
  color:white;
  flex:1;
  min-width:55px;
}

#offerSave{
  background:#D7192D;
  color:white;
}

#offerRemove{
  background:#383838;
  color:white;
}

#offerProductPreview{
  display:flex;
  align-items:center;
  gap:12px;
  background:#101010;
  border-radius:10px;
  padding:12px;
  margin-bottom:15px;
}

#offerProductImage{
  width:85px;
  height:85px;
  object-fit:contain;
  background:white;
  border-radius:8px;
}

#offerProductName{
  color:white;
  font-size:16px;
  font-weight:bold;
}

#offerMessage{
  color:white;
  line-height:1.8;
}

#offerCount{
  color:#DDD;
  font-size:14px;
}

#offerActiveList{
  margin-top:15px;
}

.offer-admin-row{
  background:#101010;
  border:1px solid #444;
  border-radius:9px;
  padding:12px;
  margin-bottom:9px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}

.offer-admin-row strong{
  color:#FF4055;
}

.offer-admin-row button{
  background:#D7192D;
  color:white;
}

`;

document.head.appendChild(style);

const panel = document.createElement("details");

panel.id = "adminOffers";

panel.hidden = true;

panel.innerHTML = `

<summary>

  🔥 إدارة الشروات والخصومات

</summary>

<div class="offer-admin-content">

  <label for="offerSearch">

    البحث عن المنتج

  </label>

  <input

    id="offerSearch"

    type="search"

    placeholder="اسم المنتج أو القسم...">

  <label for="offerCategory">

    تصفية حسب القسم

  </label>

  <select id="offerCategory">

    <option value="">جميع الأقسام</option>

  </select>

  <label for="offerProduct">

    اختيار المنتج

  </label>

  <select id="offerProduct">

    <option value="">اختر المنتج</option>

  </select>

  <div id="offerFields" hidden>

    <div id="offerProductPreview">

      <img id="offerProductImage"
        alt="صورة المنتج">

      <div id="offerProductName"></div>

    </div>

    <label class="check">

      <input

        id="offerActive"

        type="checkbox">

      تفعيل عرض الخصم

    </label>

    <label for="offerPercent">

      نسبة الخصم %

    </label>

    <input

      id="offerPercent"

      type="number"

      min="1"

      max="100"

      step="1"

      placeholder="مثال: 50">

    <div id="offerQuickButtons">

      <button type="button" data-percent="10">
        10%
      </button>

      <button type="button" data-percent="20">
        20%
      </button>

      <button type="button" data-percent="30">
        30%
      </button>

      <button type="button" data-percent="40">
        40%
      </button>

      <button type="button" data-percent="50">
        50%
      </button>

      <button type="button" data-percent="60">
        60%
      </button>

      <button type="button" data-percent="70">
        70%
      </button>

    </div>

    <div id="offerPreview">

      خصم 50%

    </div>

    <label class="check">

      <input

        id="offerFeatured"

        type="checkbox"

        checked>

      إظهار المنتج في الشريط المتحرك

    </label>

    <label for="offerOrder">

      ترتيب الظهور

    </label>

    <input

      id="offerOrder"

      type="number"

      min="0"

      step="1"

      value="0">

    <p class="hint">

      الرقم الأقل يظهر أولاً.

    </p>

    <label for="offerEnd">

      موعد انتهاء العرض (اختياري)

    </label>

    <input

      id="offerEnd"

      type="datetime-local">

    <p class="hint">

      اترك الموعد فارغاً ليبقى العرض فعالاً

      حتى تقوم بإلغائه يدوياً.

    </p>

    <p class="hint">

      نسبة الخصم للعرض فقط.

      لن يتم تغيير سعر المنتج أو السلة.

    </p>

    <button

      id="offerSave"

      type="button"

      class="full">

      حفظ العرض

    </button>

    <button

      id="offerRemove"

      type="button"

      class="full">

      إلغاء الخصم

    </button>

  </div>

  <p id="offerMessage" role="status"></p>

  <p id="offerCount"></p>

  <details>

    <summary>

      المنتجات المضافة إلى الخصومات

    </summary>

    <div id="offerActiveList"></div>

  </details>

</div>

`;

$("addProduct").before(panel);

function categoryName(product){

  const value =

    product.category_id ||

    product.category ||

    "";

  return window.getCategoryName

    ? window.getCategoryName(value)

    : value;

}

function selectedProduct(){

  return products.find(product =>

    product.id === $("offerProduct").value

  );

}

function message(text){

  $("offerMessage").textContent = text;

}

function activeOffer(product){

  const percent = Number(product.offer_percent);

  return product.offer_active === true &&

    Number.isInteger(percent) &&

    percent >= 1 &&

    percent <= 100 &&

    (

      !product.offer_end ||

      Date.parse(product.offer_end) > Date.now()

    );

}

function renderCategories(){

  const select = $("offerCategory");

  const previous = select.value;

  const categories = [...new Set(

    products.map(categoryName).filter(Boolean)

  )].sort((a,b) =>

    a.localeCompare(b,"ar")

  );

  select.replaceChildren(

    new Option("جميع الأقسام","")

  );

  categories.forEach(name => {

    select.add(new Option(name,name));

  });

  if(categories.includes(previous)){

    select.value = previous;

  }

}

function renderProducts(){

  const select = $("offerProduct");

  const previous = select.value;

  const search = $("offerSearch")

    .value.trim().toLowerCase();

  const category = $("offerCategory").value;

  const filtered = products.filter(product => {

    const matchesCategory =

      !category ||

      categoryName(product) === category;

    const matchesSearch = [

      product.name,

      product.description,

      categoryName(product)

    ].join(" ").toLowerCase().includes(search);

    return matchesCategory && matchesSearch;

  });

  select.replaceChildren(

    new Option("اختر المنتج","")

  );

  filtered.forEach(product => {

    let title = product.name || "منتج";

    if(activeOffer(product)){

      title += " — خصم " +

        product.offer_percent + "%";

    }

    if(product.active !== true){

      title += " — مخفي";

    }

    select.add(new Option(title,product.id));

  });

  if(filtered.some(product => product.id === previous)){

    select.value = previous;

  }else{

    loadProduct();

  }

}

function localDate(value){

  if(!value) return "";

  const date = new Date(value);

  if(!Number.isFinite(date.getTime())) return "";

  return new Date(

    date.getTime() -

    date.getTimezoneOffset()*60000

  ).toISOString().slice(0,16);

}

function loadProduct(){

  const product = selectedProduct();

  $("offerFields").hidden = !product;

  if(!product) return;

  $("offerProductName").textContent =

    product.name || "";

  const image = $("offerProductImage");

  const url = product.image || product.image_url || "";

  if(

    typeof url === "string" &&

    url.startsWith("https://")

  ){

    image.src = url;

    image.hidden = false;

    image.onerror = () => image.hidden = true;

  }else{

    image.hidden = true;

    image.removeAttribute("src");

  }

  $("offerActive").checked =

    product.offer_active === true;

  $("offerPercent").value =

    product.offer_percent ?? "";

  $("offerFeatured").checked =

    product.offer_featured !== false;

  $("offerOrder").value =

    product.offer_order ?? 0;

  $("offerEnd").value =

    localDate(product.offer_end);

  preview();

}

function preview(){

  const percent = Number($("offerPercent").value);

  $("offerPreview").textContent =

    Number.isInteger(percent) &&

    percent >= 1 &&

    percent <= 100

      ? "خصم " + percent + "%"

      : "حدد نسبة الخصم";

}

$("offerQuickButtons").addEventListener(

  "click",event => {

    const button = event.target.closest(

      "button[data-percent]"

    );

    if(!button || saving) return;

    $("offerPercent").value =

      button.dataset.percent;

    $("offerActive").checked = true;

    preview();

  }

);

$("offerPercent").oninput = preview;

$("offerSearch").oninput = renderProducts;

$("offerCategory").onchange = renderProducts;

$("offerProduct").onchange = () => {

  message("");

  loadProduct();

};

function renderActiveList(){

  const list = $("offerActiveList");

  list.replaceChildren();

  const active = products.filter(activeOffer);

  $("offerCount").textContent =

    "عدد العروض المفعلة: " + active.length;

  if(!active.length){

    list.textContent = "لا توجد عروض مفعلة.";

    return;

  }

  active.forEach(product => {

    const row = document.createElement("div");

    row.className = "offer-admin-row";

    const info = document.createElement("div");

    const name = document.createElement("div");

    name.textContent = product.name || "";

    const percent = document.createElement("strong");

    percent.textContent =

      "خصم " + product.offer_percent + "%";

    info.append(name,percent);

    const edit = document.createElement("button");

    edit.type = "button";

    edit.textContent = "تعديل";

    edit.onclick = () => {

      if(saving) return;

      $("offerSearch").value = "";

      $("offerCategory").value = "";

      renderProducts();

      $("offerProduct").value = product.id;

      loadProduct();

      $("offerFields").scrollIntoView({

        behavior:"smooth"

      });

    };

    row.append(info,edit);

    list.appendChild(row);

  });

}

async function saveOffer(remove = false){

  const product = selectedProduct();

  if(

    !product ||

    saving ||

    auth.currentUser?.uid !== ADMIN_UID

  ) return;

  const active =

    !remove && $("offerActive").checked;

  const percent =

    Number($("offerPercent").value);

  const order =

    Number($("offerOrder").value);

  const featured =

    $("offerFeatured").checked;

  const end = $("offerEnd").value

    ? new Date($("offerEnd").value)

    : null;

  if(active){

    if(

      !Number.isInteger(percent) ||

      percent < 1 ||

      percent > 100

    ){

      message(

        "أدخل نسبة خصم صحيحة من 1 إلى 100."

      );

      return;

    }

    if(

      !Number.isSafeInteger(order) ||

      order < 0

    ){

      message("أدخل ترتيب ظهور صحيحاً.");

      return;

    }

    if(end && (

      !Number.isFinite(end.getTime()) ||

      end.getTime() <= Date.now()

    )){

      message("حدد موعد انتهاء في المستقبل.");

      return;

    }

  }

  saving = true;

  $("offerSave").disabled = true;

  $("offerRemove").disabled = true;

  $("offerProduct").disabled = true;

  $("offerSearch").disabled = true;

  $("offerCategory").disabled = true;

  message("جاري حفظ العرض...");

  try{

    await updateDoc(

      doc(db,"products",product.id),

      {

        offer_active:active,

        offer_percent:

          active ? percent : null,

        offer_featured:

          active && featured,

        offer_order:

          active ? order : 0,

        offer_end:

          active && end

            ? end.toISOString()

            : null,

        offer_price:null,

        offer_updated_at:serverTimestamp()

      }

    );

    if(active){

      message(

        "✓ تم حفظ خصم " + percent +

        "% بنجاح دون تغيير السعر."

      );

    }else{

      $("offerActive").checked = false;

      $("offerPercent").value = "";

      $("offerEnd").value = "";

      preview();

      message("✓ تم إلغاء الخصم بنجاح.");

    }

  }catch(error){

    console.error(error);

    message(

      "تعذر حفظ العرض: " +

      (error.code || error.message)

    );

  }finally{

    saving = false;

    $("offerSave").disabled = false;

    $("offerRemove").disabled = false;

    $("offerProduct").disabled = false;

    $("offerSearch").disabled = false;

    $("offerCategory").disabled = false;

  }

}

$("offerSave").onclick = () => saveOffer();

$("offerRemove").onclick = () => {

  if(confirm("هل تريد إلغاء خصم هذا المنتج؟")){

    saveOffer(true);

  }

};

onAuthStateChanged(auth,user => {

  if(unsubscribe){

    unsubscribe();

    unsubscribe = null;

  }

  panel.hidden = user?.uid !== ADMIN_UID;

  products = [];

  panel.open = false;

  $("offerFields").hidden = true;

  $("offerSearch").value = "";

  $("offerProduct").replaceChildren();

  $("offerActiveList").replaceChildren();

  message("");

  if(panel.hidden) return;

  unsubscribe = onSnapshot(

    collection(db,"products"),

    snapshot => {

      products = snapshot.docs.map(item => ({

        ...item.data(),

        id:item.id

      })).sort((a,b) =>

        String(a.name || "").localeCompare(

          String(b.name || ""),"ar"

        )

      );

      renderCategories();

      renderProducts();

      renderActiveList();

    },

    error => {

      message(

        "تعذر تحميل المنتجات: " + error.code

      );

    }

  );

});

setInterval(() => {

  if(!panel.hidden){

    renderActiveList();

  }

},30000);