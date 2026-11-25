
import { db, auth } from "./firebase-config.js";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const ADMIN_UID = "vAwEHEC8iHNvHnLsDSWUORZM4kv2";

let categories = [];
let unsubscribe = null;
let editingId = null;

const defaults = [
  ["trophies", "الكؤوس والميداليات", "🏆"],
  ["swimming", "أدوات السباحة", "🏊"],
  ["gym", "معدات اللياقة والجيمات", "🏋️"],
  ["electric", "الأجهزة الرياضية الكهربائية", "⚡"],
  ["shoes", "الأحذية", "👟"],
  ["clothes", "الملابس", "👕"],
  ["football", "كرة القدم", "⚽"],
  ["basketball", "كرة السلة", "🏀"],
  ["handball", "كرة اليد", "🤾"],
  ["volleyball", "كرة الطائرة", "🏐"],
  ["bags", "الشناتي", "🎒"],
  ["martial", "الفنون القتالية", "🥋"],
  ["games", "الألعاب", "🎯"],
  ["supports", "المشدات", "🩹"]
];

const $ = id => document.getElementById(id);

function findCategory(value) {
  return categories.find(c =>
    c.id === value ||
    c.name === value ||
    (c.old_names || []).includes(value)
  );
}

window.getCategoryName = function(value) {
  return findCategory(value)?.name || value || "";
};

window.getCategoryId = function(value) {
  return findCategory(value)?.id || value || "";
};

function installStyles() {

  if ($("categoryManagementStyles")) return;

  const style = document.createElement("style");

  style.id = "categoryManagementStyles";

  style.textContent = `
    #categoryManagement {
      background: #FFFFFF;
      color: #101010;
      border: 1px solid #DDDDDD;
      border-top: 4px solid #B7192B;
      border-radius: 14px;
      padding: 16px;
      margin: 18px 0;
      direction: rtl;
    }

    #categoryManagement * {
      box-sizing: border-box;
    }

    #categoryManagement h2 {
      margin: 0 0 15px;
      color: #101010;
    }

    #categoryManagement button {
      background: #B7192B;
      color: white;
      border: none;
      padding: 10px 13px;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      font-weight: bold;
    }

    #categoryManagement button:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    #categoryManagement input,
    #categoryManagement select {
      display: block;
      width: 100%;
      background: #F7F7F7;
      color: #101010;
      border: 1px solid #CCCCCC;
      padding: 12px;
      border-radius: 8px;
      margin: 7px 0 14px;
      font-size: 16px;
    }

    #categoryManagement label {
      color: #222222;
      font-size: 13px;
      font-weight: bold;
    }

    .cm-toolbar,
    .cm-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .cm-row {
      background: #F5F5F5;
      border: 1px solid #DDDDDD;
      border-radius: 10px;
      padding: 12px;
      margin-top: 10px;
    }

    .cm-heading {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .cm-image {
      width: 58px;
      height: 58px;
      object-fit: contain;
      background: white;
      border-radius: 8px;
    }

    .cm-icon {
      font-size: 30px;
    }

    .cm-name {
      font-weight: bold;
      font-size: 16px;
    }

    .cm-status {
      font-size: 12px;
      margin-top: 5px;
    }

    .cm-child {
      margin-right: 18px;
      border-right: 3px solid #96989B;
    }

    #cmEditor {
      background: #F4F4F4;
      border-radius: 10px;
      padding: 14px;
      margin-top: 15px;
    }

    #cmMessage {
      color: #901323;
      font-size: 13px;
      line-height: 1.7;
      margin: 12px 0;
    }

    #cmPreview {
      width: 100px;
      height: 100px;
      object-fit: contain;
      margin: 8px 0;
    }

    #categoryManagement [hidden] {
      display: none !important;
    }
  `;

  document.head.appendChild(style);
}

function mountPanel() {

  if ($("categoryManagement")) return true;

  const dashboard = $("dashboard");

  if (!dashboard) return false;

  installStyles();

  const panel = document.createElement("section");

  panel.id = "categoryManagement";

  panel.innerHTML = `
    <h2>📁 إدارة الأقسام</h2>

    <div class="cm-toolbar">
      <button type="button" id="cmAdd">
        ＋ إضافة قسم
      </button>

      <button type="button" id="cmAddDefaults">
        إضافة الأقسام الأساسية
      </button>
    </div>

    <div id="cmMessage"></div>

    <div id="cmEditor" hidden>

      <h3 id="cmEditorTitle">إضافة قسم</h3>

      <form id="cmForm">

        <label>اسم القسم</label>
        <input id="cmName" required>

        <label>نوع القسم</label>
        <select id="cmParent">
          <option value="">قسم رئيسي</option>
        </select>

        <label>رمز القسم</label>
        <input id="cmIcon" value="🏆">

        <label>رابط صورة القسم</label>
        <input id="cmImage"
          type="url"
          placeholder="https://...">

        <label>رفع صورة من الجهاز</label>
        <input id="cmFile"
          type="file"
          accept="image/*">

        <img id="cmPreview" hidden>

        <label>ترتيب القسم</label>
        <input id="cmOrder"
          type="number"
          min="0"
          value="0"
          required>

        <label>حالة القسم</label>
        <select id="cmActive">
          <option value="true">ظاهر</option>
          <option value="false">مخفي</option>
        </select>

        <div class="cm-toolbar">
          <button type="submit" id="cmSave">
            حفظ القسم
          </button>

          <button type="button" id="cmCancel">
            إلغاء
          </button>
        </div>

      </form>

    </div>

    <div id="cmList"></div>
  `;

  const addProduct = $("addProduct");

  if (addProduct && addProduct.parentNode) {
    addProduct.parentNode.insertBefore(
      panel,
      addProduct
    );
  } else {
    dashboard.prepend(panel);
  }

  $("cmAdd").onclick = () => openEditor();

  $("cmCancel").onclick = closeEditor;

  $("cmForm").onsubmit = saveCategory;

  $("cmAddDefaults").onclick = addDefaults;

  $("cmImage").oninput = updatePreview;

  $("cmFile").onchange = uploadCategoryImage;

  return true;
}

function message(text) {
  if ($("cmMessage")) {
    $("cmMessage").textContent = text;
  }
}

function updatePreview() {

  const value = $("cmImage").value.trim();

  const preview = $("cmPreview");

  preview.hidden = !value;

  if (value) {
    preview.src = value;
  }
}

function refreshParentOptions(selected = "") {

  const select = $("cmParent");

  if (!select) return;

  select.replaceChildren(
    new Option("قسم رئيسي", "")
  );

  categories
    .filter(c => !c.parent_id && c.id !== editingId)
    .forEach(c => {
      select.add(new Option(c.name, c.id));
    });

  select.value = selected;
}

function refreshProductSelect() {

  let field = $("category");

  if (!field) return;

  const previous = field.value;

  if (field.tagName !== "SELECT") {

    const select = document.createElement("select");

    select.id = "category";
    select.name = field.name || "category";
    select.required = true;
    select.className = field.className;

    field.replaceWith(select);

    field = select;
  }

  field.replaceChildren(
    new Option("اختر القسم", "")
  );

  const roots = categories.filter(c => !c.parent_id);

  roots.forEach(parent => {

    const group = document.createElement("optgroup");

    group.label = parent.name;

    group.appendChild(
      new Option(
        parent.name + (parent.active ? "" : " — مخفي"),
        parent.id
      )
    );

    categories
      .filter(c => c.parent_id === parent.id)
      .forEach(child => {
        group.appendChild(
          new Option(
            "↳ " + child.name +
            (child.active ? "" : " — مخفي"),
            child.id
          )
        );
      });

    field.appendChild(group);
  });

  const previousId = window.getCategoryId(previous);

  if (previousId && !findCategory(previousId)) {
    field.add(new Option(previous, previousId));
  }

  field.value = previousId || "";
}

function openEditor(category = null) {

  editingId = category?.id || null;

  $("cmEditorTitle").textContent = category
    ? "تعديل القسم"
    : "إضافة قسم جديد";

  $("cmName").value = category?.name || "";

  $("cmIcon").value = category?.icon || "🏆";

  $("cmImage").value =
    category?.image || category?.image_url || "";

  $("cmFile").value = "";

  $("cmOrder").value = category?.order ??
    (Math.max(0, ...categories.map(c => c.order)) + 10);

  $("cmActive").value =
    category?.active === false ? "false" : "true";

  refreshParentOptions(category?.parent_id || "");

  $("cmEditor").hidden = false;

  updatePreview();

  message("");

  $("cmEditor").scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function closeEditor() {

  editingId = null;

  $("cmEditor").hidden = true;

  $("cmForm").reset();
}

async function uploadCategoryImage() {

  const file = $("cmFile").files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    message("يرجى اختيار صورة.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    message("حجم الصورة يجب ألا يتجاوز 10 MB.");
    return;
  }

  $("cmSave").disabled = true;

  message("جارٍ رفع الصورة...");

  try {

    const user = auth.currentUser;

    if (!user || user.uid !== ADMIN_UID) {
      throw new Error("غير مصرح");
    }

    const token = await user.getIdToken();

    const response = await fetch(
      "https://mdallal-upload.mustafanujoom-453.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          idToken: token
        })
      }
    );

    if (!response.ok) {
      throw new Error("تعذر الحصول على توقيع الرفع");
    }

    const signed = await response.json();

    if (!signed.signature || !signed.timestamp) {
      throw new Error("بيانات توقيع غير مكتملة");
    }

    const form = new FormData();

    form.append("file", file);
    form.append("api_key",
      signed.api_key || signed.apiKey || "388223638872647");
    form.append("timestamp", signed.timestamp);
    form.append("signature", signed.signature);
    form.append("upload_preset",
      signed.upload_preset || signed.uploadPreset || "products_upload");

    const upload = await fetch(
      "https://api.cloudinary.com/v1_1/mxxcenmg/image/upload",
      {
        method: "POST",
        body: form
      }
    );

    const result = await upload.json();

    if (!upload.ok || !result.secure_url) {
      throw new Error("فشل رفع الصورة");
    }

    $("cmImage").value = result.secure_url;

    updatePreview();

    message("تم رفع الصورة بنجاح.");

  } catch (error) {

    console.error(error);

    message(
      "تعذر رفع الصورة. يمكنك إدخال رابط الصورة مباشرة."
    );

  } finally {

    $("cmSave").disabled = false;

  }
}

async function saveCategory(event) {

  event.preventDefault();

  const name = $("cmName").value.trim();

  const parentId = $("cmParent").value;

  const image = $("cmImage").value.trim();

  if (!name) return;

  if (categories.some(c =>
    c.id !== editingId &&
    c.name === name
  )) {
    message("يوجد قسم بهذا الاسم بالفعل.");
    return;
  }

  if (parentId && !categories.some(c =>
    c.id === parentId && !c.parent_id
  )) {
    message("القسم الرئيسي غير صالح.");
    return;
  }

  if (editingId && parentId &&
      categories.some(c => c.parent_id === editingId)) {
    message("لا يمكن تحويل قسم لديه أقسام فرعية إلى قسم فرعي.");
    return;
  }

  if (image) {

    try {
      if (new URL(image).protocol !== "https:") {
        throw new Error();
      }
    } catch {
      message("يجب أن يكون رابط الصورة HTTPS.");
      return;
    }
  }

  const old = categories.find(c => c.id === editingId);

  const aliases = new Set(old?.old_names || []);

  if (old?.name && old.name !== name) {
    aliases.add(old.name);
  }

  const data = {
    name,
    parent_id: parentId,
    icon: $("cmIcon").value.trim() || "🏆",
    image,
    image_url: image,
    order: Math.max(0, Number($("cmOrder").value) || 0),
    active: $("cmActive").value === "true",
    old_names: [...aliases],
    updated_at: serverTimestamp()
  };

  $("cmSave").disabled = true;

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

    closeEditor();

    message("تم حفظ القسم بنجاح.");

  } catch (error) {

    console.error(error);

    message("تعذر حفظ القسم.");

  } finally {

    $("cmSave").disabled = false;

  }
}

async function toggleCategory(category) {

  try {

    await updateDoc(
      doc(db, "categories", category.id),
      {
        active: !category.active,
        updated_at: serverTimestamp()
      }
    );

    message(
      category.active
        ? "تم تغيير حالة القسم إلى مخفي."
        : "تم تغيير حالة القسم إلى ظاهر."
    );

  } catch (error) {

    console.error(error);

    message("تعذر تغيير حالة القسم.");
  }
}

async function removeCategory(category) {

  if (categories.some(c =>
    c.parent_id === category.id
  )) {
    message(
      "لا يمكن حذف القسم لأنه يحتوي على أقسام فرعية."
    );
    return;
  }

  try {

    const snapshot = await getDocs(
      collection(db, "products")
    );

    const values = [
      category.id,
      category.name,
      ...(category.old_names || [])
    ];

    const hasProducts = snapshot.docs.some(item => {

      const product = item.data();

      return values.includes(product.category) ||
        values.includes(product.category_id);

    });

    if (hasProducts) {

      message(
        "لا يمكن حذف القسم لأنه يحتوي على منتجات. انقل المنتجات إلى قسم آخر أو أخفِ القسم."
      );

      return;
    }

    if (!confirm("هل تريد حذف قسم " + category.name + "؟")) {
      return;
    }

    await deleteDoc(
      doc(db, "categories", category.id)
    );

    message("تم حذف القسم.");

  } catch (error) {

    console.error(error);

    message("تعذر حذف القسم.");
  }
}

async function moveCategory(category, direction) {

  const siblings = categories.filter(c =>
    (c.parent_id || "") ===
    (category.parent_id || "")
  );

  const index = siblings.findIndex(c =>
    c.id === category.id
  );

  const target = index + direction;

  if (target < 0 || target >= siblings.length) return;

  [siblings[index], siblings[target]] =
    [siblings[target], siblings[index]];

  try {

    await Promise.all(
      siblings.map((c, i) =>
        updateDoc(
          doc(db, "categories", c.id),
          {
            order: (i + 1) * 10,
            updated_at: serverTimestamp()
          }
        )
      )
    );

    message("تم تحديث ترتيب الأقسام.");

  } catch (error) {

    console.error(error);

    message("تعذر تحديث الترتيب.");
  }
}

function actionButton(text, handler, color) {

  const button = document.createElement("button");

  button.type = "button";

  button.textContent = text;

  button.onclick = handler;

  if (color) {
    button.style.background = color;
  }

  return button;
}

function renderCategories() {

  const list = $("cmList");

  if (!list) return;

  list.replaceChildren();

  function renderRow(category, child = false) {

    const row = document.createElement("div");

    row.className = child
      ? "cm-row cm-child"
      : "cm-row";

    const heading = document.createElement("div");

    heading.className = "cm-heading";

    const imageUrl = category.image || category.image_url;

    if (imageUrl) {

      const image = document.createElement("img");

      image.className = "cm-image";
      image.src = imageUrl;
      image.alt = category.name;

      heading.appendChild(image);

    } else {

      const icon = document.createElement("span");

      icon.className = "cm-icon";
      icon.textContent = category.icon || "🏆";

      heading.appendChild(icon);
    }

    const details = document.createElement("div");

    const name = document.createElement("div");

    name.className = "cm-name";
    name.textContent = category.name;

    const status = document.createElement("div");

    status.className = "cm-status";

    status.textContent =
      (child ? "قسم فرعي" : "قسم رئيسي") +
      " — " +
      (category.active ? "ظاهر" : "مخفي");

    status.style.color =
      category.active ? "#217A38" : "#B7192B";

    details.append(name, status);

    heading.appendChild(details);

    const actions = document.createElement("div");

    actions.className = "cm-actions";

    actions.append(

      actionButton(
        "↑",
        () => moveCategory(category, -1),
        "#555555"
      ),

      actionButton(
        "↓",
        () => moveCategory(category, 1),
        "#555555"
      ),

      actionButton(
        "✏️ تعديل",
        () => openEditor(category),
        "#333333"
      ),

      actionButton(
        category.active ? "إخفاء" : "إظهار",
        () => toggleCategory(category),
        category.active ? "#777777" : "#217A38"
      ),

      actionButton(
        "حذف",
        () => removeCategory(category),
        "#B7192B"
      )

    );

    if (!child) {

      actions.appendChild(
        actionButton(
          "＋ قسم فرعي",
          () => {
            openEditor();
            $("cmParent").value = category.id;
          }
        )
      );
    }

    row.append(heading, actions);

    list.appendChild(row);
  }

  const roots = categories.filter(c => !c.parent_id);

  roots.forEach(parent => {

    renderRow(parent);

    categories
      .filter(c => c.parent_id === parent.id)
      .forEach(child => renderRow(child, true));
  });

  categories
    .filter(c => c.parent_id &&
      !categories.some(p => p.id === c.parent_id))
    .forEach(c => renderRow(c, true));

  if (!categories.length) {
    list.textContent = "لا توجد أقسام مسجلة حالياً.";
  }
}

async function addDefaults() {

  if (!confirm(
    "إضافة الأقسام الأساسية والملابس الفرعية دون حذف الأقسام الموجودة؟"
  )) return;

  $("cmAddDefaults").disabled = true;

  try {

    const existing = [...categories];

    let clothesId = null;

    for (let i = 0; i < defaults.length; i++) {

      const [key, name, icon] = defaults[i];

      const found = existing.find(c =>
        !c.parent_id &&
        (c.id === key || c.name === name)
      );

      if (found) {

        if (key === "clothes") {
          clothesId = found.id;
        }

        continue;
      }

      const ref = await addDoc(
        collection(db, "categories"),
        {
          name,
          icon,
          parent_id: "",
          image: "",
          image_url: "",
          active: true,
          old_names: [],
          order: (i + 1) * 10,
          created_at: serverTimestamp()
        }
      );

      existing.push({
        id: ref.id,
        name,
        parent_id: ""
      });

      if (key === "clothes") {
        clothesId = ref.id;
      }
    }

    if (clothesId) {

      const subcategories = [
        "بنطلون",
        "بيجاما",
        "هودي",
        "شورت",
        "سويت شيرت"
      ];

      for (let i = 0; i < subcategories.length; i++) {

        const name = subcategories[i];

        if (existing.some(c =>
          c.name === name &&
          c.parent_id === clothesId
        )) continue;

        await addDoc(
          collection(db, "categories"),
          {
            name,
            icon: "👕",
            parent_id: clothesId,
            image: "",
            image_url: "",
            active: true,
            old_names: [],
            order: (i + 1) * 10,
            created_at: serverTimestamp()
          }
        );
      }
    }

    message(
      "تمت إضافة الأقسام الأساسية دون حذف الأقسام القديمة."
    );

  } catch (error) {

    console.error(error);

    message("حدث خطأ أثناء إضافة الأقسام.");

  } finally {

    $("cmAddDefaults").disabled = false;
  }
}

onAuthStateChanged(auth, user => {

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  if (!user || user.uid !== ADMIN_UID) {

    $("categoryManagement")?.remove();

    categories = [];

    return;
  }

  if (!mountPanel()) {

    console.error("Dashboard not found");

    return;
  }

  unsubscribe = onSnapshot(

    collection(db, "categories"),

    snapshot => {

      categories = snapshot.docs.map(item => {

        const data = item.data();

        return {
          ...data,
          id: item.id,
          name: data.name || "",
          parent_id: data.parent_id || "",
          order: Number(data.order) || 0,
          active: data.active === true,
          old_names: Array.isArray(data.old_names)
            ? data.old_names
            : []
        };

      }).sort((a, b) =>
        a.order - b.order ||
        a.name.localeCompare(b.name, "ar")
      );

      renderCategories();

      refreshProductSelect();

      if (!$("cmEditor").hidden) {
        refreshParentOptions($("cmParent").value);
      }

    },

    error => {

      console.error(error);

      message("تعذر تحميل الأقسام من Firebase.");
    }

  );

});
