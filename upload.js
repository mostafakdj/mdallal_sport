
import { auth } from "./firebase-config.js";

const WORKER_URL =
  "https://mdallal-upload.mustafanujoom-453.workers.dev/";

const ADMIN_UID =
  "vAwEHEC8iHNvHnLsDSWUORZM4kv2";

const imageInput = document.getElementById("image");

const uploadPanel = document.createElement("div");

uploadPanel.style.cssText = `
  background: #151515;
  border: 1px dashed #C9A227;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
`;

uploadPanel.innerHTML = `
  <h3 style="color:#F2D675">
    📷 صورة المنتج
  </h3>

  <input
    id="productImageFile"
    type="file"
    accept="image/*"
  >

  <img
    id="imagePreview"
    alt="معاينة الصورة"
    hidden
    style="
      width:100%;
      max-height:250px;
      object-fit:contain;
      border-radius:10px;
      margin-bottom:12px;
    "
  >

  <button
    id="uploadImageButton"
    type="button"
    style="width:100%"
  >
    رفع الصورة
  </button>

  <p
    id="uploadMessage"
    style="color:#F2D675;font-size:14px"
    aria-live="polite"
  ></p>
`;

imageInput.after(uploadPanel);

const fileInput =
  document.getElementById("productImageFile");

const preview =
  document.getElementById("imagePreview");

const uploadButton =
  document.getElementById("uploadImageButton");

const message =
  document.getElementById("uploadMessage");

const saveButton =
  document.getElementById("saveButton");

let previewUrl = null;
let uploading = false;

function resetUpload() {

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  fileInput.value = "";
  preview.removeAttribute("src");
  preview.hidden = true;
  message.textContent = "";

}

document.getElementById("addProduct")
  .addEventListener("click", resetUpload);

document.getElementById("cancelEdit")
  .addEventListener("click", resetUpload);

document.getElementById("productForm")
  .addEventListener("reset", resetUpload);

fileInput.addEventListener("change", () => {

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  const file = fileInput.files[0];

  preview.hidden = true;
  preview.removeAttribute("src");
  message.textContent = "";

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    message.textContent = "اختر ملف صورة صالحاً.";
    fileInput.value = "";
    return;
  }

  previewUrl = URL.createObjectURL(file);

  preview.src = previewUrl;
  preview.hidden = false;

  message.textContent = "الصورة جاهزة للرفع.";

});

async function compressImage(file) {

  const bitmap = await createImageBitmap(file);

  const maxSize = 1200;

  const ratio = Math.min(
    1,
    maxSize / Math.max(bitmap.width, bitmap.height)
  );

  const canvas = document.createElement("canvas");

  canvas.width = Math.max(
    1, Math.round(bitmap.width * ratio)
  );

  canvas.height = Math.max(
    1, Math.round(bitmap.height * ratio)
  );

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FFFFFF";

  ctx.fillRect(
    0, 0, canvas.width, canvas.height
  );

  ctx.drawImage(
    bitmap, 0, 0, canvas.width, canvas.height
  );

  bitmap.close();

  return new Promise((resolve, reject) => {

    canvas.toBlob(
      blob => blob
        ? resolve(blob)
        : reject(new Error("تعذر ضغط الصورة")),
      "image/jpeg",
      0.82
    );

  });

}

uploadButton.addEventListener("click", async () => {

  if (uploading) return;

  const user = auth.currentUser;

  if (!user || user.uid !== ADMIN_UID) {

    message.textContent =
      "يجب تسجيل الدخول بحساب المدير.";

    return;

  }

  const file = fileInput.files[0];

  if (!file) {

    message.textContent = "اختر صورة أولاً.";

    return;

  }

  if (file.size > 20 * 1024 * 1024) {

    message.textContent =
      "اختر صورة أصغر من 20 ميغابايت.";

    return;

  }

  uploading = true;
  uploadButton.disabled = true;
  saveButton.disabled = true;
  fileInput.disabled = true;

  document.getElementById("cancelEdit").disabled = true;
  document.getElementById("addProduct").disabled = true;

  const list = document.getElementById("productList");
  list.inert = true;

  try {

    message.textContent = "جاري تجهيز الصورة...";

    const compressed = await compressImage(file);

    const token = await user.getIdToken();

    message.textContent = "جاري التحقق من الصلاحيات...";

    const signatureResponse = await fetch(
      WORKER_URL,
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: "{}"
      }
    );

    const signed = await signatureResponse.json();

    if (!signatureResponse.ok) {

      throw new Error(
        signed.error || "تعذر الاتصال بخدمة الرفع"
      );

    }

    const formData = new FormData();

    formData.append(
      "file", compressed, "product.jpg"
    );

    formData.append("api_key", signed.api_key);

    formData.append("timestamp", signed.timestamp);

    formData.append("signature", signed.signature);

    formData.append(
      "upload_preset",
      signed.upload_preset
    );

    message.textContent = "جاري رفع الصورة...";

    const uploadResponse = await fetch(
      "https://api.cloudinary.com/v1_1/" +
      signed.cloud_name +
      "/image/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const result = await uploadResponse.json();

    if (!uploadResponse.ok || !result.secure_url) {

      throw new Error(
        result.error?.message || "فشل رفع الصورة"
      );

    }

    if (auth.currentUser?.uid !== ADMIN_UID) {
      throw new Error("انتهت جلسة تسجيل الدخول");
    }

    imageInput.value = result.secure_url;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }

    preview.src = result.secure_url;
    preview.hidden = false;

    message.textContent =
      "✅ تم رفع الصورة بنجاح. اضغط حفظ المنتج.";

  } catch (error) {

    message.textContent =
      "❌ " + error.message;

  } finally {

    uploading = false;
    uploadButton.disabled = false;
    saveButton.disabled = false;
    fileInput.disabled = false;

    document.getElementById("cancelEdit").disabled = false;
    document.getElementById("addProduct").disabled = false;

    list.inert = false;

  }

});
