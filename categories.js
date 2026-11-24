
import { db, auth } from "./firebase-config.js";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const ADMIN_UID =
  "vAwEHEC8iHNvHnLsDSWUORZM4kv2";

const WORKER_URL =
  "https://mdallal-upload.mustafanujoom-453.workers.dev/";

const $ = id => document.getElementById(id);

const DEFAULT_CATEGORIES = [
  ["baseball", "معدات بيسبول"],
  ["boxing", "معدات ملاكمة"],
  ["football", "معدات كرة قدم"],
  ["clothes", "ملابس رياضية"],
  ["gym", "أدوات كمال أجسام"],
  ["accessories", "إكسسوارات رياضية"],
  ["swimming", "أدوات سباحة"],
  ["fitness", "معدات لياقة بدنية"],
  ["training", "مستلزمات تدريب"],
  ["bags", "حقائب رياضية"],
  ["shoes", "أحذية رياضية"],
  ["other", "أدوات رياضات متنوعة"]
];

const aliases = {
  baseball: ["معدات البيسبول"],
  boxing: ["معدات الملاكمة"],
  football: ["معدات كرة القدم"]
};

let categories = [];
let editingId = null;
let unsubscribe = null;
let busy = false;
let previewURL = null;

function isAdmin() {
  return auth.currentUser?.uid === ADMIN_UID;
}

function matchesCategory(value, category) {
  const original = DEFAULT_CATEGORIES.find(
    item => item[0] === category.id
  );

  return [
    category.id,
    category.name,
    original?.[1],
    ...(category.old_names || []),
    ...(aliases[category.id] || [])
  ].filter(Boolean).includes(value);
}

window.getCategoryName = value => {
  const category = categories.find(
    c => matchesCategory(value, c)
  );

  return category?.name ||
    DEFAULT_CATEGORIES.find(
      item => item[0] === value
    )?.[1] ||
    value || "";
};

window.getCategoryId = value => {
  return categories.find(
    c => matchesCategory(value, c)
  )?.id || value || "";
};

const style = document.createElement("style");

style.textContent = `
#categoryPanel {
  background: #202020;
  border: 1px solid #C9A227;
  border-radius: 15px;
  padding: 18px;
  margin: 15px 0;
}

#categoryPanel h2,
#categoryPanel h3 {
  color: #F2D675;
}

.category-card {
  background: #151515;
  border: 1px solid #444;
  border-radius: 12px;
  padding: 15px;
  margin: 12px 0;
}

.category-card img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  background: white;
  border-radius: 8px;
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

#categoryPreview {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  background: #151515;
  border-radius: 10px;
  margin-bottom: 10px;
}

#categoryMessage {
  color: #F2D675;
  line-height: 1.7;
}

#categoryUploadBox {
  border: 1px dashed #C9A227;
  padding: 15px;
  border-radius: 12px;
  margin: 15px 0;
}

#categoryUploadBox p {
  color: #CCC;
  font-size: 14px;
}

#categoryPanel[hidden],
#categoryForm[hidden],
#manageCategories[hidden],
#categoryPreview[hidden] {
  display: none !important;
}
`;

document.head.appendChild(style);

const manageButton =
  document.createElement("button");

manageButton.id = "manageCategories";
manageButton.className = "full";
manageButton.type = "button";
manageButton.hidden = true;

manageButton.textContent =
  "📁 إدارة الأقسام";

const panel = document.createElement("section");

panel.id = "categoryPanel";
panel.hidden = true;

panel.innerHTML = `
  <h2>📁 إدارة الأقسام</h2>

  <button id="restoreCategories"
    type="button" class="secondary full">
    استعادة الأقسام الـ12 الأصلية
  </button>

  <button id="newCategory"
    type="button" class="full">
    + إضافة قسم جديد
  </button>

  <button id="closeCategories"
    type="button" class="secondary full">
    إغلاق إدارة الأقسام
  </button>

  <form id="categoryForm" hidden>

    <h3 id="categoryFormTitle">
      إضافة قسم جديد
    </h3>

    <label>اسم القسم</label>

    <input id="categoryTitle"
      maxlength="100"
      placeholder="اكتب اسم القسم"
      required>

    <div id="categoryUploadBox">

      <label>📷 صورة القسم</label>

      <input id="categoryFile"
        type="file"
        accept="image/*">

      <img id="categoryPreview"
        alt="معاينة صورة القسم"
        hidden>

      <button id="uploadCategoryImage"
        type="button" class="full">
        رفع الصورة من الهاتف
      </button>

      <p id="categoryUploadMessage"></p>

    </div>

    <label>رابط الصورة</label>

    <input id="categoryImage"
      type="url"
      placeholder="يظهر الرابط بعد رفع الصورة">

    <label>ترتيب ظهور القسم</label>

    <input id="categoryOrder"
      type="number"
      min="0"
      step="1"
      value="1"
      required>

    <label class="check">

      <input id="categoryActive"
        type="checkbox" checked>

      إظهار القسم في المتجر

    </label>

    <button id="saveCategory"
      type="submit" class="full">
      حفظ القسم
    </button>

    <button id="cancelCategory"
      type="button" class="secondary full">
      إلغاء
    </button>

  </form>

  <p id="categoryMessage"
    aria-live="polite"></p>

  <div id="categoryList"></div>
`;

$("addProduct").before(manageButton);
manageButton.after(panel);

const oldCategoryInput = $("category");

const categorySelect =
  document.createElement("select");

categorySelect.id = "category";
categorySelect.required = true;

oldCategoryInput.replaceWith(categorySelect);

$("categoryOptions")?.remove();

function refreshCategorySelect() {

  const previous = categorySelect.value;

  categorySelect.replaceChildren();

  const placeholder = new Option(
    "اختر القسم",
    ""
  );

  placeholder.disabled = true;

  categorySelect.add(placeholder);

  categories.forEach(category => {

    const option = new Option(
      category.name +
      (category.active ? "" : " — مخفي"),
      category.id
    );

    categorySelect.add(option);

  });

  if (
    previous &&
    [...categorySelect.options].some(
      option => option.value === previous
    )
  ) {

    categorySelect.value = previous;

  } else {

    categorySelect.value = "";

  }

}

refreshCategorySelect();

function message(text) {
  $("categoryMessage").textContent = text;
}

function uploadMessage(text) {
  $("categoryUploadMessage").textContent = text;
}

function setBusy(value) {

  busy = value;

  [
    "saveCategory",
    "cancelCategory",
    "closeCategories",
    "restoreCategories",
    "newCategory",
    "uploadCategoryImage",
    "categoryFile",
    "categoryTitle",
    "categoryImage",
    "categoryOrder",
    "categoryActive"
  ].forEach(id => {

    $(id).disabled = value;

  });

}

function makeButton(text, className, action) {

  const button = document.createElement("button");

  button.type = "button";
  button.textContent = text;
  button.className = className;
  button.onclick = action;

  return button;

}

function showPreview(url) {

  const preview = $("categoryPreview");

  if (url) {

    preview.src = url;
    preview.hidden = false;

  } else {

    preview.removeAttribute("src");
    preview.hidden = true;

  }

}

function clearPreviewURL() {

  if (previewURL) {

    URL.revokeObjectURL(previewURL);
    previewURL = null;

  }

}

function openCategoryEditor(category = null) {

  if (!isAdmin() || busy) return;

  clearPreviewURL();

  editingId = category?.id || null;

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

  showPreview(category?.image || "");

  $("categoryForm").hidden = false;

  uploadMessage("");
  message("");

  $("categoryForm").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}

function closeCategoryEditor() {

  editingId = null;

  clearPreviewURL();

  $("categoryForm").reset();

  $("categoryForm").hidden = true;

  showPreview("");

  uploadMessage("");

}

manageButton.onclick = () => {

  if (!isAdmin() || busy) return;

  panel.hidden = !panel.hidden;

  if (!panel.hidden) {

    panel.scrollIntoView({
      behavior: "smooth"
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

  if (!busy) closeCategoryEditor();

};

$("restoreCategories").onclick = async () => {

  if (!isAdmin() || busy) return;

  if (!confirm(
    "هل تريد استعادة الأقسام الأصلية دون حذف الأقسام الحالية؟"
  )) return;

  setBusy(true);

  message("جاري استعادة الأقسام...");

  try {

    const snapshot = await getDocs(
      collection(db, "categories")
    );

    const existing = snapshot.docs.map(item => ({
      ...item.data(),
      id: item.id
    }));

    const batch = writeBatch(db);

    let added = 0;

    DEFAULT_CATEGORIES.forEach(
      ([id, name], index) => {

        const exists = existing.some(c =>
          c.id === id ||
          c.name === name ||
          (aliases[id] || []).includes(c.name)
        );

        if (!exists) {

          batch.set(
            doc(db, "categories", id),
            {
              name: name,
              image: "",
              order: index + 1,
              active: true,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            }
          );

          added++;

        }

      }
    );

    if (added > 0) {

      await batch.commit();

    }

    message(
      added > 0
        ? "تمت استعادة " + added + " قسم بنجاح."
        : "الأقسام الأصلية موجودة بالفعل."
    );

  } catch (error) {

    message(
      "تعذرت الاستعادة: " + error.message
    );

  } finally {

    setBusy(false);

  }

};

$("categoryFile").addEventListener(
  "change",
  () => {

    clearPreviewURL();

    const file = $("categoryFile").files[0];

    if (!file) {

      showPreview($("categoryImage").value);
      return;

    }

    if (
      file.type &&
      !file.type.startsWith("image/")
    ) {

      uploadMessage("يرجى اختيار صورة.");

      $("categoryFile").value = "";

      showPreview($("categoryImage").value);

      return;

    }

    previewURL = URL.createObjectURL(file);

    showPreview(previewURL);

    uploadMessage(
      "تم اختيار الصورة. اضغط على رفع الصورة."
    );

  }
);

async function compressImage(file) {

  const url = URL.createObjectURL(file);

  try {

    const image = new Image();

    image.src = url;

    await image.decode();

    const scale = Math.min(
      1,
      1200 / Math.max(
        image.naturalWidth,
        image.naturalHeight
      )
    );

    const canvas =
      document.createElement("canvas");

    canvas.width = Math.max(
      1,
      Math.round(image.naturalWidth * scale)
    );

    canvas.height = Math.max(
      1,
      Math.round(image.naturalHeight * scale)
    );

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";

    ctx.fillRect(
      0, 0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      image,
      0, 0,
      canvas.width,
      canvas.height
    );

    const blob = await new Promise(resolve => {

      canvas.toBlob(
        resolve,
        "image/jpeg",
        0.82
      );

    });

    if (!blob) {

      throw new Error("تعذر ضغط الصورة.");

    }

    return blob;

  } finally {

    URL.revokeObjectURL(url);

  }

}

$("uploadCategoryImage").onclick = async () => {

  if (!isAdmin() || busy) return;

  const file = $("categoryFile").files[0];

  if (!file) {

    uploadMessage("اختر صورة من الهاتف أولاً.");

    return;

  }

  if (file.size > 20 * 1024 * 1024) {

    uploadMessage("حجم الصورة أكبر من 20 MB.");

    return;

  }

  setBusy(true);

  uploadMessage("جاري تجهيز ورفع الصورة...");

  try {

    const compressed =
      await compressImage(file);

    const token =
      await auth.currentUser.getIdToken();

    const response = await fetch(
      WORKER_URL,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const signature = await response.json();

    if (!response.ok) {

      throw new Error(
        signature.error || "تعذر تصريح الرفع."
      );

    }

    const formData = new FormData();

    formData.append(
      "file",
      compressed,
      "category.jpg"
    );

    formData.append(
      "api_key",
      signature.api_key
    );

    formData.append(
      "timestamp",
      signature.timestamp
    );

    formData.append(
      "signature",
      signature.signature
    );

    formData.append(
      "upload_preset",
      signature.upload_preset
    );

    const uploadResponse = await fetch(

      "https://api.cloudinary.com/v1_1/" +
      signature.cloud_name +
      "/image/upload",

      {
        method: "POST",
        body: formData
      }

    );

    const result = await uploadResponse.json();

    if (
      !uploadResponse.ok ||
      !result.secure_url
    ) {

      throw new Error(
        result.error?.message ||
        "تعذر رفع الصورة."
      );

    }

    $("categoryImage").value =
      result.secure_url;

    $("categoryFile").value = "";

    clearPreviewURL();

    showPreview(result.secure_url);

    uploadMessage(
      "تم رفع الصورة بنجاح. اضغط حفظ القسم. ✅"
    );

  } catch (error) {

    uploadMessage(
      "خطأ في رفع الصورة: " + error.message
    );

  } finally {

    setBusy(false);

  }

};

function renderCategories() {

  const list = $("categoryList");

  list.replaceChildren();

  if (!categories.length) {

    list.textContent =
      "لا توجد أقسام. اضغط استعادة الأقسام الأصلية.";

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

      const image =
        document.createElement("img");

      image.src = category.image;
      image.alt = category.name;
      image.loading = "lazy";

      image.onerror = () => {

        image.hidden = true;

      };

      card.append(image);

    }

    const title =
      document.createElement("h3");

    title.textContent =
      "📁 " + category.name;

    const order =
      document.createElement("p");

    order.textContent =
      "الترتيب: " + (category.order ?? 0);

    const status =
      document.createElement("p");

    status.textContent =
      category.active
        ? "🟢 القسم ظاهر"
        : "⚪ القسم مخفي";

    const actions =
      document.createElement("div");

    actions.className = "category-actions";

    actions.append(

      makeButton(
        "✏️ تعديل",
        "",
        () => openCategoryEditor(category)
      ),

      makeButton(
        category.active
          ? "إخفاء"
          : "إظهار",
        "secondary",
        () => toggleCategory(category)
      ),

      makeButton(
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

      message("يرجى كتابة اسم القسم.");

      return;

    }

    if (
      image &&
      !image.startsWith("https://")
    ) {

      message("رابط الصورة غير صحيح.");

      return;

    }

    if (
      !Number.isInteger(order) ||
      order < 0
    ) {

      message("ترتيب القسم غير صحيح.");

      return;

    }

    if ($("categoryFile").files.length) {

      message(
        "اضغط رفع الصورة أولاً قبل حفظ القسم."
      );

      return;

    }

    const duplicate = categories.some(c =>

      c.id !== editingId &&

      c.name.trim().toLowerCase() ===
      name.toLowerCase()

    );

    if (duplicate) {

      message("هذا القسم موجود مسبقاً.");

      return;

    }

    const previous = categories.find(
      c => c.id === editingId
    );

    const oldNames = [
      ...new Set([
        ...(previous?.old_names || []),
        previous?.name
      ].filter(Boolean))
    ];

    const data = {

      name: name,

      image: image,

      order: order,

      active: $("categoryActive").checked,

      old_names: oldNames,

      updated_at: serverTimestamp()

    };

    setBusy(true);

    message("جاري حفظ القسم...");

    try {

      if (editingId) {

        await updateDoc(
          doc(db, "categories", editingId),
          data
        );

      } else {

        await addDoc(
          collection(db, "categories"),
          {
            ...data,
            created_at: serverTimestamp()
          }
        );

      }

      closeCategoryEditor();

      message("تم حفظ القسم بنجاح. ✅");

    } catch (error) {

      message(
        "تعذر حفظ القسم: " + error.message
      );

    } finally {

      setBusy(false);

    }

  }
);

async function toggleCategory(category) {

  if (!isAdmin() || busy) return;

  setBusy(true);

  try {

    await updateDoc(

      doc(db, "categories", category.id),

      {
        active: !category.active,
        updated_at: serverTimestamp()
      }

    );

    message("تم تحديث حالة القسم. ✅");

  } catch (error) {

    message(
      "تعذر تحديث القسم: " + error.message
    );

  } finally {

    setBusy(false);

  }

}

async function removeCategory(category) {

  if (!isAdmin() || busy) return;

  setBusy(true);

  message("جاري التحقق من منتجات القسم...");

  try {

    const snapshot = await getDocs(
      collection(db, "products")
    );

    const related = snapshot.docs.filter(item => {

      const product = item.data();

      return (
        matchesCategory(
          product.category,
          category
        ) ||
        product.category_id === category.id
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

    if (!confirm(
      "هل تريد حذف قسم " +
      category.name +
      " نهائياً؟"
    )) {

      message("تم إلغاء الحذف.");

      return;

    }

    await deleteDoc(
      doc(db, "categories", category.id)
    );

    if (editingId === category.id) {

      closeCategoryEditor();

    }

    message("تم حذف القسم بنجاح. ✅");

  } catch (error) {

    message(
      "تعذر حذف القسم: " + error.message
    );

  } finally {

    setBusy(false);

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

  refreshCategorySelect();

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

      categories = snapshot.docs.map(item => ({

        ...item.data(),

        id: item.id

      }));

      categories.sort((a, b) =>

        (Number(a.order) || 0) -

        (Number(b.order) || 0)

      );

      renderCategories();

      refreshCategorySelect();

      $("search").dispatchEvent(
        new Event("input")
      );

    },

    error => {

      message(
        "تعذر تحميل الأقسام: " +
        error.message
      );

    }

  );

});

console.log(
  "MDALLAL SPORTS Categories V20 Loaded"
);
