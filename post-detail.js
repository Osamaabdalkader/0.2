// post-detail.js
import { 
  auth, database, serverTimestamp,
  ref, push, set,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const postDetailContent = document.getElementById('post-detail-content');
const buyNowBtn = document.getElementById('buy-now-btn');
const adminIcon = document.getElementById('admin-icon');

// متغيرات النظام
let currentPost = null;

// تحميل تفاصيل المنشور
document.addEventListener('DOMContentLoaded', () => {
    const postData = JSON.parse(localStorage.getItem('currentPost'));
    if (postData) {
        currentPost = postData;
        showPostDetail(postData);
    } else {
        postDetailContent.innerHTML = '<p class="error">لم يتم العثور على المنشور</p>';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
    
    // التحقق من صلاحية المستخدم
    checkAuthState();
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, user => {
        if (user) {
            const userRef = ref(database, 'users/' + user.uid);
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    if (userData.isAdmin) {
                        adminIcon.style.display = 'flex';
                    }
                }
            });
        }
    });
}

// عرض تفاصيل المنشور
function showPostDetail(post) {
    postDetailContent.innerHTML = `
        <div class="post-detail-header">
            ${post.imageUrl ? `
                <img src="${post.imageUrl}" alt="${post.title}" class="post-detail-image">
            ` : `
                <div class="post-detail-image no-image">
                    <i class="fas fa-image"></i>
                </div>
            `}
        </div>
        
        <div class="post-detail-body">
            <h2 class="post-detail-title">${post.title}</h2>
            <p class="post-detail-description">${post.description}</p>
            
            <div class="post-detail-info">
                ${post.price ? `
                    <div class="info-item">
                        <i class="fas fa-tag"></i>
                        <span>السعر: ${post.price}</span>
                    </div>
                ` : ''}
                
                ${post.location ? `
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>المكان: ${post.location}</span>
                    </div>
                ` : ''}
                
                ${post.phone ? `
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <span>رقم الهاتف: ${post.phone}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="post-author">
                <div class="author-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="author-info">
                    <div class="author-name">${post.authorName || 'مستخدم'}</div>
                    <div class="author-badge">البائع</div>
                </div>
            </div>
        </div>
    `;
}

// زر اشتري الآن
buyNowBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) {
        alert('يجب تسجيل الدخول أولاً');
        window.location.href = 'auth.html';
        return;
    }
    
    if (!currentPost) {
        alert('حدث خطأ في تحميل بيانات المنشور');
        return;
    }
    
    createOrder(user.uid, currentPost);
});

// إنشاء طلب جديد
async function createOrder(userId, post) {
    try {
        const orderData = {
            buyerId: userId,
            buyerName: await getBuyerName(userId),
            sellerId: post.authorId,
            sellerName: post.authorName || 'مستخدم',
            postId: post.id,
            postTitle: post.title,
            postPrice: post.price || 'غير محدد',
            postImage: post.imageUrl || '',
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef);
        await set(newOrderRef, orderData);
        
        alert('تم إنشاء الطلب بنجاح! سيتم التواصل معك قريباً.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error creating order:', error);
        alert('حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
    }
}

// الحصول على اسم المشتري
async function getBuyerName(userId) {
    try {
        const userRef = ref(database, 'users/' + userId);
        const snapshot = await onValue(userRef);
        if (snapshot.exists()) {
            return snapshot.val().name || 'مشتري';
        }
        return 'مشتري';
    } catch (error) {
        console.error('Error getting buyer name:', error);
        return 'مشتري';
    }
}�واصل معك الإدارة قريباً.', 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد ثانيتين
        setTimeout(() => {
            navigateTo('index.html');
        }, 2000);
    } catch (error) {
        console.error('Error creating order: ', error);
        showAlert('حدث خطأ أثناء إرسال الطلب: ' + error.message, 'error');
    }
}

// تشغيل التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initPostDetailPage();
});