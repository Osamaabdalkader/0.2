// add-post.js - الإصدار المعدل وفق الكود الأصلي
import { 
  auth, database, storage, serverTimestamp,
  ref, push, onValue, storageRef, uploadBytesResumable, getDownloadURL
} from './firebase.js';

// عناصر DOM
const publishBtn = document.getElementById('publish-btn');
const postImageInput = document.getElementById('post-image');
const loadingOverlay = document.getElementById('loading-overlay');
const uploadProgress = document.getElementById('upload-progress');

// نشر منشور جديد
publishBtn.addEventListener('click', async e => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'auth.html';
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
            imageUrl: imageUrl || '',
            createdAt: Date.now()
        };
        
        // حفظ المنشور في قاعدة البيانات
        await push(ref(database, 'posts'), postData);
        
        // إخفاء شاشة التحميل وإظهار الرسالة
        loadingOverlay.classList.add('hidden');
        alert('تم نشر المنشور بنجاح!');
        resetAddPostForm();
        window.location.href = 'index.html'; // الانتقال إلى الصفحة الرئيسية
    } 
    catch (error) {
        console.error('Error adding post: ', error);
        loadingOverlay.classList.add('hidden');
        alert('حدث خطأ أثناء نشر المنشور: ' + error.message);
    }
});

// إعادة تعيين النموذج
function resetAddPostForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-description').value = '';
    document.getElementById('post-price').value = '';
    document.getElementById('post-location').value = '';
    document.getElementById('post-phone').value = '';
    document.getElementById('post-image').value = '';
    
    // إخفاء معاينة الصورة إذا كانت موجودة
    const imagePreview = document.getElementById('image-preview');
    const imageName = document.getElementById('image-name');
    if (imagePreview) imagePreview.classList.add('hidden');
    if (imageName) imageName.textContent = 'لم يتم اختيار صورة';
}
