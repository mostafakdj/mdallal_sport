
import { db, auth } from "./firebase-config.js";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const ADMIN_UID =
  "vAwEHEC8iHNvHnLsDSWUORZM4kv2";

const $ = id => document.getElementById(id);

let categories = [];
let editingCategory = null;
let unsubscribe = null;
let busy = false;

function isAdmin() {
  return auth.currentUser?.uid === ADMIN_UID;
}

const style = document.createElement("style");

style.textContent = `
#manageCategories {
  display: block;
  width: 100%;
  background: #C9A227;
  color: #111;
  padding: 15px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  margin: 15px 0;
  cursor: pointer;
}

#manageCategories[hidden],
#categoryPanel[hidden],
#categoryForm[hidden] {
  display: none !important;
}

#categoryPanel {
  background: #151515;
  border: 1px solid #C9A227;
  border-radius: 15px;
  padding: 18px;
  margin: 15px 0;
  color: #FFFFFF;
  direction: rtl;
}

#categoryPanel h2,
#categoryPanel h3 {
  color: #F2D675;
}

#categoryPanel label {
  display: block;
  margin: 12px 0 6px;
}

#categoryPanel input:not([type="checkbox"]) {
  width: 100%;
  box-sizing: border-box;
  background: #222;
  color: white;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 12px;
}

#categoryPanel button {
  background: #C9A227;
  color: #111;
  padding: 12px;
  border: none;
  border-radius: 8px;
  margin: 5px 0;
  font-weight: bold;
  cursor: pointer;
}

#categoryPanel button.full {
  width: 100%;
}

#categoryPanel button.secondary {
  background: #333;
  color: white;
}

#categoryPanel button.danger {
  background: #A52222;
  color: white;
}

.category-card {
  background: #202020;
  border: 1px solid #444;
  border-radius: 12px;
  padding: 15px;
  margin: 12px 0;
}

.category-card img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  background: white;
  border-radius: 8px;
}

.category-card h3 {
  color: #F2D675;
  margin: 10px 0;
}

.category-card p {
  color: #CCC;
  font-size: 14px;
}

.category-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

#categoryMessage {
  color: #F2D675;
  line-height: 1.7;
}

#categoryList {
  margin-top: 15px;
}

#categoryForm {
  margin-top: 15px;
}
`;

document.head.appendChild(style);

const manageButton =
  document.createElement("button");

manageButton.id = "manageCategories";
manageButton.type = "button";
manageButton.hidden = true;

manageButton.textContent =
  "📁 إدارة الأقسام";

const panel = document.createElement("section");

panel.id = "categoryPanel";
panel.hidden = true;

panel.innerHTML = `
  <h2>📁 إدارة الأقسام</h2>

  <button id="newCategory"
    type="button"
    class="full">

    ＋ إضافة قسم جديد

  </button>

  <button id="closeCategories"
    type="button"
    class="secondary full">

    إغلاق إدارة الأقسام

  </button>

  <form id="categoryForm" hidden>

    <h3 id="categoryFormTitle">
      إضافة قسم جديد
    </h3>

    <label>اسم القسم</label>

    <input id="categoryTitle"
      maxlength="100"
      placeholder="مثلاً: معدات كرة القدم"
      required>

    <label>رابط صورة القسم</label>

    <input id="categoryImage"
      type="url"
      placeholder="https://...">

    <label>ترتيب ظهور القسم</label>

    <input id="categoryOrder"
      type="number"
      min="0"
      step="1"
      value="1"
      required>

    <label>

      <input id="categoryActive"
        type="checkbox"
        checked>

      إظهار القسم في المتجر

    </label>

    <button id="saveCategory"
      type="submit"
      class="full">

      حفظ القسم

    </button>

    <button id="cancelCategory"
      type="button"
      class="secondary full">

      إلغاء

    </button>

  </form>

  <p id="categoryMessage"
    aria-live="polite"></p>

  <div id="categoryList"></div>
`;

const addProductButton = $("addProduct");

if (addProductButton) {

  addProductButton.before(manageButton);

  manageButton.after(panel);

} else {

  document.body.append(manageButton, panel);

}

function message(value) {

  $("categoryMessage").textContent = value;

}

function button(text, className, action) {

  const element =
    document.createElement("button");

  element.type = "button";
  element.textContent = text;
  element.className = className;
  element.onclick = action;

  return element;

}

function openCategoryEditor(category = null) {

  if (!isAdmin() || busy) return;

  editingCategory = category?.id || null;

  $("categoryForm").reset();

  $("categoryFormTitle").textContent =
    category
      ? "تعديل القسم"
      : "إضافة قسم جديد";

  $("categoryTitle").value =
    category?.name || "";

  $("categoryImage").value =
    category?.image || "";

  $("categoryOrder").value =
    category?.order ??
    Math.max(
      0,
      ...categories.map(
        c => Number(c.order) || 0
      )
    ) + 1;

  $("categoryActive").checked =
    category
      ? category.active === true
      : true;

  $("categoryForm").hidden = false;

  message("");

  $("categoryForm").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}

function closeCategoryEditor() {

  editingCategory = null;

  $("categoryForm").reset();

  $("categoryForm").hidden = true;

}

manageButton.onclick = () => {

  if (!isAdmin()) return;

  panel.hidden = !panel.hidden;

  if (!panel.hidden) {

    panel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

};

$("closeCategories").onclick = () => {

  if (busy) return;

  panel.hidden = true;

  closeCategoryEditor();

};

$("newCategory").onclick = () => {

  openCategoryEditor();

};

$("cancelCategory").onclick = () => {

  if (!busy) {

    closeCategoryEditor();

  }

};

function renderCategories() {

  const list = $("categoryList");

  list.replaceChildren();

  if (!categories.length) {

    list.textContent =
      "لا توجد أقسام حالياً.";

    return;

  }

  categories.forEach(category => {

    const card =
      document.createElement("article");

    card.className = "category-card";

    if (
      typeof category.image === "string" &&
      category.image.startsWith("https://")
    ) {

      const img =
        document.createElement("img");

      img.src = category.image;
      img.alt = category.name || "";
      img.loading = "lazy";

      img.onerror = () => {

        img.hidden = true;

      };

      card.append(img);

    }

    const title =
      document.createElement("h3");

    title.textContent =
      "📁 " +
      (category.name || "قسم بدون اسم");

    const order =
      document.createElement("p");

    order.textContent =
      "الترتيب: " +
      (category.order ?? 0);

    const status =
      document.createElement("p");

    status.textContent =
      category.active
        ? "🟢 القسم ظاهر"
        : "⚪ القسم مخفي";

    const actions =
      document.createElement("div");

    actions.className =
      "category-actions";

    actions.append(

      button(
        "✏️ تعديل",
        "",
        () => openCategoryEditor(category)
      ),

      button(
        category.active
          ? "إخفاء"
          : "إظهار",
        "secondary",
        () => toggleCategory(category)
      ),

      button(
        "🗑 حذف",
        "danger",
        () => removeCategory(category)
      )

    );

    card.append(
      title,
      order,
      status,
      actions
    );

    list.append(card);

  });

}

$("categoryForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!isAdmin() || busy) return;

    const name =
      $("categoryTitle").value.trim();

    const image =
      $("categoryImage").value.trim();

    const order =
      Number($("categoryOrder").value);

    if (!name) {

      message(
        "يرجى كتابة اسم القسم."
      );

      return;

    }

    if (
      image &&
      !image.startsWith("https://")
    ) {

      message(
        "يجب أن يبدأ رابط الصورة بـ HTTPS."
      );

      return;

    }

    if (
      !Number.isInteger(order) ||
      order < 0
    ) {

      message(
        "يرجى إدخال ترتيب صحيح."
      );

      return;

    }

    const duplicate =
      categories.some(category =>

        String(category.name || "")
          .trim()
          .toLowerCase() ===
          name.toLowerCase() &&

        category.id !== editingCategory

      );

    if (duplicate) {

      message(
        "يوجد قسم بهذا الاسم مسبقاً."
      );

      return;

    }

    const data = {

      name: name,

      image: image,

      order: order,

      active:
        $("categoryActive").checked,

      updated_at:
        serverTimestamp()

    };

    busy = true;

    $("saveCategory").disabled = true;

    message("جاري حفظ القسم...");

    try {

      if (editingCategory) {

        await updateDoc(

          doc(
            db,
            "categories",
            editingCategory
          ),

          data

        );

      } else {

        await addDoc(

          collection(db, "categories"),

          {

            ...data,

            created_at:
              serverTimestamp()

          }

        );

      }

      closeCategoryEditor();

      message(
        "تم حفظ القسم بنجاح. ✅"
      );

    } catch (error) {

      console.error(error);

      message(
        "تعذر الحفظ: " +
        (error.code || error.message)
      );

    } finally {

      busy = false;

      $("saveCategory").disabled = false;

    }

  }
);

async function toggleCategory(category) {

  if (!isAdmin() || busy) return;

  busy = true;

  try {

    await updateDoc(

      doc(
        db,
        "categories",
        category.id
      ),

      {

        active: !category.active,

        updated_at:
          serverTimestamp()

      }

    );

    message(
      "تم تحديث حالة القسم. ✅"
    );

  } catch (error) {

    console.error(error);

    message(
      "تعذر التحديث: " +
      (error.code || error.message)
    );

  } finally {

    busy = false;

  }

}

async function removeCategory(category) {

  if (!isAdmin() || busy) return;

  busy = true;

  message(
    "جاري التحقق من منتجات القسم..."
  );

  try {

    const snapshot = await getDocs(

      collection(db, "products")

    );

    const legacyNames = {

      baseball: [
        "معدات بيسبول",
        "معدات البيسبول"
      ],

      boxing: [
        "معدات ملاكمة",
        "معدات الملاكمة"
      ],

      football: [
        "معدات كرة قدم",
        "معدات كرة القدم"
      ]

    };

    const names = [

      category.id,

      category.name,

      ...(legacyNames[category.id] || [])

    ].filter(Boolean);

    const related =
      snapshot.docs.filter(item => {

        const product = item.data();

        return (

          names.includes(
            product.category
          ) ||

          product.category_id ===
            category.id

        );

      });

    if (related.length > 0) {

      message(

        "لا يمكن حذف القسم لأنه يحتوي على " +

        related.length +

        " منتج. انقل المنتجات إلى قسم آخر أولاً."

      );

      return;

    }

    const confirmed = confirm(

      "هل تريد حذف قسم " +

      category.name +

      " نهائياً؟"

    );

    if (!confirmed) {

      message("تم إلغاء الحذف.");

      return;

    }

    await deleteDoc(

      doc(
        db,
        "categories",
        category.id
      )

    );

    if (
      editingCategory === category.id
    ) {

      closeCategoryEditor();

    }

    message(
      "تم حذف القسم بنجاح. ✅"
    );

  } catch (error) {

    console.error(error);

    message(
      "تعذر حذف القسم: " +
      (error.code || error.message)
    );

  } finally {

    busy = false;

  }

}

onAuthStateChanged(auth, user => {

  if (unsubscribe) {

    unsubscribe();

    unsubscribe = null;

  }

  categories = [];

  panel.hidden = true;

  closeCategoryEditor();

  renderCategories();

  if (
    !user ||
    user.uid !== ADMIN_UID
  ) {

    manageButton.hidden = true;

    return;

  }

  manageButton.hidden = false;

  unsubscribe = onSnapshot(

    collection(db, "categories"),

    snapshot => {

      categories =
        snapshot.docs.map(item => ({

          ...item.data(),

          id: item.id

        }));

      categories.sort((a, b) =>

        (Number(a.order) || 0) -

        (Number(b.order) || 0)

      );

      renderCategories();

    },

    error => {

      console.error(error);

      message(

        "تعذر تحميل الأقسام: " +

        (error.code || error.message)

      );

    }

  );

});

console.log(
  "MDALLAL SPORTS Categories Loaded"
);
