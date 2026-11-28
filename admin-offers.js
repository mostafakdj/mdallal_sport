
import {db,auth} from './firebase-config.js';

import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const ADMIN = 'vAwEHEC8iHNvHnLsDSWUORZM4kv2';

const $ = id => document.getElementById(id);

const panel = document.createElement('details');

panel.id = 'adminOffers';

panel.className = 'panel';

panel.hidden = true;

panel.innerHTML = `

<summary style="
  cursor:pointer;
  font-weight:bold;
  font-size:19px;
  color:#FFFFFF;
  background:#D7192D;
  padding:14px;
  border-radius:8px;
">

  🔥 إدارة الشروات والخصومات

</summary>

<div style="padding-top:15px">

  <label for="offerSearch">
    ابحث عن المنتج
  </label>

  <input
    id="offerSearch"
    type="search"
    placeholder="اسم المنتج أو القسم">

  <label for="offerProduct">
    اختر المنتج
  </label>

  <select id="offerProduct"></select>

  <div id="offerFields" hidden>

    <p id="offerBase"></p>

    <label class="check">

      <input
        id="offerActive"
        type="checkbox">

      تفعيل الخصم

    </label>

    <label for="offerPrice">
      السعر بعد الخصم (لكامل وحدة البيع)
    </label>

    <input
      id="offerPrice"
      type="number"
      min="0"
      step="0.01">

    <p id="offerPreview"
      style="
        background:#101010;
        color:#FF5264;
        font-size:20px;
        font-weight:bold;
        padding:15px;
        border-radius:9px;
        text-align:center;
      ">
    </p>

    <label class="check">

      <input
        id="offerFeatured"
        type="checkbox">

      إظهاره في الشريط المتحرك

    </label>

    <label for="offerOrder">
      ترتيب الظهور (الأقل أولاً)
    </label>

    <input
      id="offerOrder"
      type="number"
      min="0"
      step="1"
      value="0">

    <label for="offerEnd">
      موعد انتهاء العرض (اختياري)
    </label>

    <input
      id="offerEnd"
      type="datetime-local">

    <p class="hint">
      يتم تحديد الموعد حسب توقيت جهازك.
      اتركه فارغاً إذا أردت استمرار العرض
      حتى إلغائه يدوياً.
    </p>

    <button
      type="button"
      id="offerSave"
      class="full"
      style="background:#D7192D;color:white">

      حفظ العرض

    </button>

    <button
      type="button"
      id="offerRemove"
      class="secondary full">

      إلغاء الخصم

    </button>

  </div>

  <p id="offerMessage" role="status"></p>

  <p id="offerCount"></p>

</div>

`;

$('addProduct').before(panel);

let items = [];

let unsubscribe = null;

let busy = false;

function selected(){

  return items.find(
    p => p.id === $('offerProduct').value
  );

}

function message(t){

  $('offerMessage').textContent = t;

}

function options(){

  const id = $('offerProduct').value;

  const q = $('offerSearch').value
    .trim()
    .toLowerCase();

  $('offerProduct').replaceChildren(
    new Option('اختر منتجاً','')
  );

  const filtered = items.filter(p => [

    p.name,

    p.category,

    window.getCategoryName?.(p.category_id)

  ].join(' ').toLowerCase().includes(q));

  for(const p of filtered){

    $('offerProduct').add(

      new Option(

        `${p.name} — ${p.price ?? '؟'} `+

        `${p.currency || 'USD'}`+

        `${p.offer_active ? ' | عرض' : ''}`+

        `${p.active !== true ? ' | مخفي' : ''}`,

        p.id

      )

    );

  }

  if(
    [...$('offerProduct').options]
      .some(o => o.value === id)
  ){

    $('offerProduct').value = id;

  }else{

    load();

  }

  $('offerCount').textContent =

    'العروض المفعلة: '+

    items.filter(p =>

      p.offer_active === true &&

      (
        !p.offer_end ||
        Date.parse(p.offer_end) > Date.now()
      )

    ).length;

}

function localDate(s){

  const d = new Date(s);

  if(!Number.isFinite(d.getTime())) return '';

  return new Date(

    d.getTime() -
    d.getTimezoneOffset()*60000

  ).toISOString().slice(0,16);

}

function load(){

  const p = selected();

  $('offerFields').hidden = !p;

  if(!p) return;

  $('offerBase').textContent =

    `السعر الأصلي: ${p.price ?? 'غير محدد'} `+

    `${p.currency || 'USD'} / `+

    `${p.sale_unit === 'dozen' ? 'دزينة' : 'قطعة'}`;

  $('offerActive').checked =
    p.offer_active === true;

  $('offerPrice').value =
    p.offer_price ?? '';

  $('offerFeatured').checked =
    p.offer_featured !== false;

  $('offerOrder').value =
    p.offer_order ?? 0;

  $('offerEnd').value =

    p.offer_end
      ? localDate(p.offer_end)
      : '';

  preview();

}

function preview(){

  const p = selected();

  const v = Number($('offerPrice').value);

  const b = Number(p?.price);

  $('offerPreview').textContent =

    $('offerPrice').value !== '' &&
    b > v &&
    v >= 0

      ? 'نسبة الخصم: '+

        Math.max(
          1,
          Math.floor((b-v)/b*100)
        )+'%'

      : 'أدخل سعراً أقل من السعر الأصلي';

}

$('offerSearch').oninput = options;

$('offerProduct').onchange = load;

$('offerPrice').oninput = preview;

async function save(remove=false){

  const p = selected();

  if(
    !p ||
    busy ||
    auth.currentUser?.uid !== ADMIN
  ) return;

  const active =
    !remove && $('offerActive').checked;

  const value =
    Number($('offerPrice').value);

  const order =
    Number($('offerOrder').value);

  const featured =
    $('offerFeatured').checked;

  const end =

    $('offerEnd').value

      ? new Date($('offerEnd').value)

      : null;

  if(

    active &&

    (

      $('offerPrice').value === '' ||

      !Number.isFinite(value) ||

      value < 0 ||

      !Number.isSafeInteger(order) ||

      order < 0 ||

      (

        end &&

        (

          !Number.isFinite(end.getTime()) ||

          end.getTime() <= Date.now()

        )

      )

    )

  ){

    message(
      'تحقق من السعر والترتيب وموعد الانتهاء.'
    );

    return;

  }

  busy = true;

  $('offerSave').disabled = true;

  $('offerRemove').disabled = true;

  $('offerProduct').disabled = true;

  $('offerSearch').disabled = true;

  message('جاري حفظ العرض...');

  try{

    await runTransaction(db,async tx => {

      const ref = doc(db,'products',p.id);

      const snap = await tx.get(ref);

      if(!snap.exists()){

        throw Error('المنتج غير موجود');

      }

      const latest = snap.data();

      if(

        active &&

        (

          latest.price == null ||

          !Number.isFinite(Number(latest.price)) ||

          value >= Number(latest.price)

        )

      ){

        throw Error(
          'سعر العرض يجب أن يكون أقل من السعر الأصلي الحالي'
        );

      }

      tx.update(ref,{

        offer_active:active,

        offer_price:
          active ? value : null,

        offer_featured:
          active && featured,

        offer_order:
          active ? order : 0,

        offer_end:

          active && end

            ? end.toISOString()

            : null,

        offer_updated_at:
          serverTimestamp()

      });

    });

    message(

      active

        ? '✓ تم حفظ العرض بنجاح'

        : '✓ تم إلغاء الخصم'

    );

    if(!active){

      $('offerActive').checked = false;

      $('offerPrice').value = '';

      $('offerEnd').value = '';

      preview();

    }

  }catch(e){

    message('تعذر الحفظ: '+e.message);

  }finally{

    busy = false;

    $('offerSave').disabled = false;

    $('offerRemove').disabled = false;

    $('offerProduct').disabled = false;

    $('offerSearch').disabled = false;

  }

}

$('offerSave').onclick = () => save();

$('offerRemove').onclick = () => save(true);

onAuthStateChanged(auth,user => {

  unsubscribe?.();

  unsubscribe = null;

  panel.hidden = user?.uid !== ADMIN;

  items = [];

  $('offerProduct').replaceChildren();

  $('offerFields').hidden = true;

  if(panel.hidden) return;

  unsubscribe = onSnapshot(

    collection(db,'products'),

    snap => {

      items = snap.docs.map(d => ({

        ...d.data(),

        id:d.id

      })).sort((a,b) =>

        String(a.name)
          .localeCompare(String(b.name),'ar')

      );

      options();

    },

    e => message(
      'تعذر تحميل المنتجات: '+e.code
    )

  );

});
