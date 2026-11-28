
import {db} from './firebase-config.js';

import {
  collection,
  query,
  where,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const KEY = '__mdallal_offers__';
const NAME = 'الشروات والخصومات';

const $ = id => document.getElementById(id);

let deals = new Map();
let opened = null;

const css = document.createElement('style');

css.textContent = `
#offersStrip{
  background:#D7192D;
  padding:12px 9px;
  margin:0 auto 18px;
  color:white;
  max-width:1100px;
  border-radius:0 0 12px 12px;
}

.offers-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  margin-bottom:10px;
}

.offers-head h2{
  font-size:19px;
  margin:0;
}

.offers-head button,
.offer-open{
  background:#101010;
  color:white;
  border:0;
  border-radius:8px;
  padding:9px;
  font-weight:bold;
  cursor:pointer;
}

.offers-track{
  display:flex;
  gap:9px;
  overflow-x:auto;
  scroll-snap-type:x mandatory;
  scrollbar-width:thin;
  direction:rtl;
}

.offer-tile{
  flex:0 0 clamp(135px,40vw,210px);
  background:#101010;
  color:white;
  border-radius:10px;
  overflow:hidden;
  scroll-snap-align:start;
  cursor:pointer;
  position:relative;
}

.offer-photo{
  background:white;
  aspect-ratio:1;
  display:grid;
  place-items:center;
}

.offer-photo img{
  width:100%;
  height:100%;
  object-fit:contain;
}

.offer-percent{
  position:absolute;
  top:6px;
  right:6px;
  background:#D7192D;
  color:white;
  padding:6px;
  border-radius:6px;
  font-weight:bold;
  z-index:2;
}

.offer-tile-info{
  padding:10px;
}

.offer-tile-info h3{
  font-size:14px;
  margin:0 0 8px;
  overflow-wrap:anywhere;
}

.offer-old{
  color:#AAA;
  font-size:12px;
  text-decoration:line-through;
}

.offer-new{
  color:#FF5264;
  font-weight:900;
  font-size:18px;
}

.offer-open{
  background:#D7192D;
  width:100%;
  margin-top:8px;
}

.category.offer-category .category-picture{
  background:#101010;
  color:#FF4055;
  font-size:64px;
  font-weight:900;
}

.category.offer-category .category-footer{
  background:#D7192D;
}

.product.offer-product{
  background:#101010;
  color:white;
  border-color:#101010;
  position:relative;
}

.offer-product .product-image{
  background:white;
}

.offer-product .product-category,
.offer-product .product-description{
  color:#CCC;
}

.offer-product .price{
  color:#FF5264;
}

.offer-product .add-cart{
  background:#D7192D;
}

.offer-price-note{
  display:block;
  font-size:12px;
  color:#888;
  text-decoration:line-through;
}

.offer-cart-price{
  color:#D7192D;
  font-size:13px;
  margin-top:8px;
}
`;

document.head.append(css);

const strip = document.createElement('section');

strip.id = 'offersStrip';
strip.hidden = true;

strip.innerHTML = `
<div class="offers-head">
  <h2>🔥 الشروات والخصومات</h2>
  <button type="button">عرض الكل ‹</button>
</div>

<div class="offers-track"
  aria-label="العروض المتحركة">
</div>
`;

$('sectionBanner').before(strip);

const track = strip.querySelector('.offers-track');

function offer(p){

  const d = deals.get(String(p.id));

  if(!d || !p.available) return null;

  const base = Number(p.price);
  const value = Number(d.offer_price);

  if(
    p.price == null ||
    d.offer_price == null ||
    !Number.isFinite(base) ||
    !Number.isFinite(value) ||
    value < 0 ||
    value >= base ||
    d.offer_active !== true
  ) return null;

  if(
    d.offer_end &&
    (
      !Number.isFinite(Date.parse(d.offer_end)) ||
      Date.parse(d.offer_end) <= Date.now()
    )
  ) return null;

  return {
    base,
    value,
    percent:Math.max(
      1,
      Math.floor((base-value)/base*100)
    ),
    featured:d.offer_featured !== false,
    order:Number(d.offer_order) || 0
  };

}

function money(n,p){

  return `${n} ${p.currency || 'USD'}`;

}

function text(tag,cls,value){

  const el = document.createElement(tag);

  el.className = cls;
  el.textContent = value;

  return el;

}

function list(){

  return products
    .filter(p => offer(p))
    .sort((a,b) => offer(a).order-offer(b).order);

}

function enter(){

  navigate('home');

  selectCategory(KEY);

  $('catalog').scrollIntoView({
    behavior:'smooth'
  });

}

strip.querySelector('button').onclick = enter;

const originalCategories = renderCategories;
const originalProducts = renderProducts;
const originalMake = makeProduct;
const originalCart = renderCart;
const originalNavigate = navigate;

function openTile(id){

  const card = [...$('products')
    .querySelectorAll('.product')]
    .find(c => c.dataset.productId === id);

  if(card){

    card.click();
    return;

  }

  enter();

  const target = [...$('products')
    .querySelectorAll('.product')]
    .find(c => c.dataset.productId === id);

  target?.click();

}

function renderStrip(){

  const items = list()
    .filter(p => offer(p).featured);

  strip.hidden =
    currentPage !== 'home' ||
    selectedCategory !== 'الكل' ||
    !!searchInput.value.trim() ||
    !items.length;

  const signature = JSON.stringify(
    items.map(p => [
      p.id,
      p.name,
      p.image_url,
      p.currency,
      offer(p)
    ])
  );

  if(signature === strip.dataset.signature) return;

  strip.dataset.signature = signature;

  track.replaceChildren();

  for(const p of items){

    const d = offer(p);

    const tile = document.createElement('article');

    tile.className = 'offer-tile';

    const photo = document.createElement('div');

    photo.className = 'offer-photo';

    const url = safeImage(p.image_url);

    if(url){

      const img = document.createElement('img');

      img.src = url;
      img.alt = p.name;
      img.loading = 'lazy';

      photo.append(img);

    }else{

      photo.textContent = '📦';

    }

    const info = document.createElement('div');

    info.className = 'offer-tile-info';

    const btn = text(
      'button',
      'offer-open',
      'تفاصيل العرض'
    );

    btn.type = 'button';

    info.append(

      text('h3','',p.name),

      text(
        'div',
        'offer-old',
        money(d.base,p)
      ),

      text(
        'div',
        'offer-new',
        money(d.value,p)+' / '+getUnitLabel(p)
      ),

      btn

    );

    tile.append(

      photo,

      text(
        'span',
        'offer-percent',
        '−'+d.percent+'%'
      ),

      info

    );

    tile.onclick = () => openTile(p.id);

    track.append(tile);

  }

}

renderCategories = function(){

  originalCategories();

  if(!catalogReady) return;

  if(selectedCategory === KEY){

    categoryList.replaceChildren();

    $('backFilter').hidden = false;

    return;

  }

  if(
    !['الكل','وصل حديثاً'].includes(selectedCategory)
  ) return;

  const b = document.createElement('button');

  b.type = 'button';

  b.className = 'category offer-category';

  const pic = text(
    'div',
    'category-picture',
    '%'
  );

  const foot = text(
    'div',
    'category-footer',
    NAME
  );

  foot.style.justifyContent = 'center';

  b.append(pic,foot);

  b.onclick = enter;

  categoryList.prepend(b);

};

makeProduct = function(p){

  const card = originalMake(p);

  const d = offer(p);

  if(d){

    card.classList.add('offer-product');

    const price = card.querySelector('.price');

    if(price){

      price.textContent = money(d.value,p);

      price.before(
        text(
          'span',
          'offer-price-note',
          money(d.base,p)
        )
      );

    }

    card.append(
      text(
        'span',
        'offer-percent',
        '−'+d.percent+'%'
      )
    );

  }

  return card;

};

renderProducts = function(){

  if(selectedCategory !== KEY){

    originalProducts();

  }else{

    const items = list().filter(p =>
      [p.name,p.category,p.description]
        .join(' ')
        .toLowerCase()
        .includes(
          searchInput.value.trim().toLowerCase()
        )
    );

    $('productTitle').textContent = NAME;

    $('productsCount').textContent =
      items.length+' منتج';

    productsContainer.replaceChildren();

    if(!items.length){

      const message = document.createElement('p');

      message.textContent =
        'لا توجد خصومات متاحة حالياً';

      productsContainer.append(message);

    }else{

      items.forEach(p =>
        productsContainer.append(makeProduct(p))
      );

    }

  }

  renderStrip();

};

renderCart = function(){

  originalCart();

  const container = $('cartItems');

  if(!container) return;

  const rows = container.querySelectorAll('.cart-row');

  Object.values(cart).forEach((item,i) => {

    const p = window.getStoreProduct(
      item.productId || item.id
    );

    const d = p && offer(p);

    if(d && rows[i]){

      rows[i]
        .querySelector('.cart-details')
        ?.append(
          text(
            'div',
            'offer-cart-price',
            'سعر العرض الحالي: '+
            money(d.value,p)+
            ' / '+getUnitLabel(p)+
            ' | الإجمالي: '+
            money(
              Math.round(
                d.value*item.quantity*100
              )/100,
              p
            )
          )
        );

    }

  });

};

window.navigate = navigate = function(page){

  originalNavigate(page);

  renderStrip();

};

const oldSet = window.setCatalogData;

window.setCatalogData = function(data){

  const was = selectedCategory === KEY;

  oldSet(data);

  if(was){

    selectedCategory = KEY;

    renderCategories();

    renderProducts();

  }

  renderStrip();

};

document.addEventListener('click',e => {

  const card = e.target.closest?.(
    '.product[data-product-id]'
  );

  if(
    card &&
    !document.querySelector(
      '.product-modal:not([hidden])'
    )
  ){

    opened = card.dataset.productId;

  }

},true);

document.addEventListener('keydown',e => {

  if(e.key === 'Enter' || e.key === ' '){

    const card = e.target.closest?.(
      '.product[data-product-id]'
    );

    if(card){

      opened = card.dataset.productId;

    }

  }

},true);

function detail(){

  const modal = document.querySelector('.product-modal');

  if(!modal || modal.hidden || !opened) return;

  const p = window.getStoreProduct(opened);

  if(!p) return;

  const d = offer(p);

  const el = $('detailPrice');

  if(!el || p.price == null) return;

  const value =
    money(d ? d.value : p.price,p)+
    ' / '+getUnitLabel(p);

  if(el.textContent !== value){

    el.textContent = value;

  }

  el.style.color = d ? '#D7192D' : '';

  let note = $('offerDetailOld');

  if(d){

    if(!note){

      note = text('div','offer-price-note','');

      note.id = 'offerDetailOld';

      el.before(note);

    }

    note.textContent =
      money(d.base,p)+
      ' — خصم '+d.percent+'%';

  }else{

    note?.remove();

  }

}

let detailObserver;

function bindDetail(){

  const modal = document.querySelector('.product-modal');

  if(!modal || detailObserver) return;

  detailObserver = new MutationObserver(() => {

    if(modal.hidden){

      $('offerDetailOld')?.remove();

    }else{

      detail();

    }

  });

  detailObserver.observe(modal,{
    attributes:true,
    attributeFilter:['hidden']
  });

}

function refresh(){

  renderCategories();

  renderProducts();

  renderFavorites();

  renderCart();

  bindDetail();

  detail();

}

onSnapshot(

  query(
    collection(db,'products'),
    where('active','==',true)
  ),

  snap => {

    deals = new Map(
      snap.docs.map(doc => [
        doc.id,
        doc.data()
      ])
    );

    refresh();

  },

  err => {

    console.error('Offers:',err);

    deals.clear();

    refresh();

  }

);

let pauseUntil = 0;

for(const event of [
  'pointerdown',
  'touchstart',
  'wheel',
  'focusin'
]){

  track.addEventListener(
    event,
    () => pauseUntil = Date.now()+8000,
    {passive:true}
  );

}

setInterval(() => {

  if(
    strip.hidden ||
    Date.now() < pauseUntil ||
    document.hidden ||
    matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  ) return;

  const first = track.firstElementChild;

  if(
    !first ||
    track.scrollWidth <= track.clientWidth
  ) return;

  const max =
    track.scrollWidth-track.clientWidth;

  if(Math.abs(track.scrollLeft) >= max-4){

    track.scrollTo({
      left:0,
      behavior:'smooth'
    });

  }else{

    track.scrollBy({
      left:-(first.offsetWidth+9),
      behavior:'smooth'
    });

  }

},3000);

let last = '';

setInterval(() => {

  const next = JSON.stringify(
    list().map(p => [p.id,offer(p)])
  );

  if(next !== last){

    last = next;

    refresh();

  }

  bindDetail();

},1000);

refresh();
