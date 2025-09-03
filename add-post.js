import { 
    auth, database, storage, 
    onAuthStateChanged, ref, push, serverTimestamp, set, onValue,
    storageRef, uploadBytesResumable, getDownloadURL
} from './firebase-init.js';

// عناصر DOM
const loadingOverlay = document.getElementById('loading-overlay');
const uploadProgress = document.getElementById('upload-progress');
const publishBtn = document.getElementById('publish-btn');
const postImageInput = document.getElementById('post-image');
const chooseImageBtn = document.getElementById('choose-image-btn');
const cameraBtn = document.getElementById('camera-btn');
const imageName = document.getElementById('image-name');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const removeImageBtn = document.getElementById('remove-image-btn');
const homeIcon = document.getElementById('home-icon');
const userInfo = document.getElementById('user-info');

// متغيرات النظام
let currentUserData = null;

// تحقق من حالة المستخدم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // المستخدم مسجل الدخول
            const userRef = ref(database, 'users/' + user.uid);
            
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    currentUserData = snapshot.val();
                    currentUserData.uid = user.uid;
                    updateUserInfo();
                } else {
                    // إذا لم يكن لدى المستخدم بيانات، توجيهه للصفحة الرئيسية
                    window.location.href = 'index.html';
                }
            });
        } else {
            // إذا لم يكن المستخدم مسجلاً، إعادة توجيهه للصفحة الرئيسية
            window.location.href = 'index.html';
        }
    });
}

// تحديث معلومات المستخدم في الواجهة
function updateUserInfo() {
    if (currentUserData) {
        userInfo.innerHTML = `
            <div class="user-detail">
                <i class="fas fa-user"></i>
                <span>${currentUserData.name || 'مستخدم'}</span>
            </div>
        `;
    }
}

// نشر منشور جديد - الكود المعدل كما في الأصل
publishBtn.addEventListener('click', async e => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html#auth';
        return;
    }
    
    const title = document.getElementById('post-title').value;
    const description = document.getElementById('post-description').value;
    const price = document.getElementById('post-price').value;
    const location = document.getElementById('post-location').value;
    const phone = document.getElementById('post-phone').value;
    const imageFile = postImageInput.files[0];
    
    if (!title || !description || !location || !phone) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    try {
        // إظهار شاشة التحميل
        loadingOverlay.classList.remove('hidden');
        uploadProgress.style.width = '0%';
        
        let imageUrl = null;
        if (imageFile) {
            // استخدام uploadBytesResumable لتتبع التقدم
            const fileRef = storageRef(storage, 'post_images/' + Date.now() + '_' + imageFile.name);
            const uploadTask = uploadBytesResumable(fileRef, imageFile);
            
            // انتظار اكتمال الرفع مع تحديث شريط التقدم
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // تحديث شريط التقدم
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        uploadProgress.style.width = progress + '%';
                    },
                    (error) => {
                        reject(error);
                    },
                    () => {
                        // الرفع اكتمل بنجاح
                        resolve();
                    }
                );
            });
            
            // الحصول على رابط التحميل بعد اكتمال الرفع
            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
        }
        
        // الحصول على بيانات المستخدم
        const userRef = ref(database, 'users/' + user.uid);
        const userSnapshot = await new Promise((resolve) => {
            onValue(userRef, (snapshot) => resolve(snapshot), { onlyOnce: true });
        });
        
        if (!userSnapshot.exists()) {
            throw new Error('بيانات المستخدم غير موجودة');
        }
        
        const userData = userSnapshot.val();
        
        // إنشاء كائن المنشور
        const postData = {
            title: title,
            description: description,
            price: price || '',
            location: location,
            phone: phone,
            authorId: user.uid,
            authorName: userData.name,
            authorPhone: userData.phone,
            timestamp: serverTimestamp(),
            imageUrl: imageUrl || ''
        };
        
        // حفظ المنشور في قاعدة البيانات
        await push(ref(database, 'posts'), postData);
        
        // إخفاء شاشة التحميل وإظهار الرسالة
        loadingOverlay.classList.add('hidden');
        alert('تم نشر المنشور بنجاح!');
        resetAddPostForm();
        window.location.href = 'index.html';
    } 
    catch (error) {
        console.error('Error adding post: ', error);
        loadingOverlay.classList.add('hidden');
        alert('حدث خطأ أثناء نشر المنشور: ' + error.message);
    }
});

// إعادة تعيين نموذج إضافة المنشور
function resetAddPostForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-description').value = '';
    document.getElementById('post-price').value = '';
    document.getElementById('post-location').value = '';
    document.getElementById('post-phone').value = '';
    postImageInput.value = '';
    imageName.textContent = 'لم يتم اختيار صورة';
    imagePreview.classList.add('hidden');
}

// اختيار صورة من المعرض
chooseImageBtn.addEventListener('click', () => {
    postImageInput.click();
});

// فتح الكاميرا (إذا كان الجهاز يدعمها)
cameraBtn.addEventListener('click', () => {
    postImageInput.setAttribute('capture', 'environment');
    postImageInput.click();
});

// عرض معاينة الصورة
postImageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        imageName.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// إزالة الصورة المختارة
removeImageBtn.addEventListener('click', () => {
    postImageInput.value = '';
    imageName.textContent = 'لم يتم اختيار صورة';
    imagePreview.classList.add('hidden');
});

// العودة للصفحة الرئيسية
homeIcon.addEventListener('click', () => {
    window.location.href = 'index.html';
});