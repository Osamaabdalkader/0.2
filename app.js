// استيراد دوال Firebase
import { 
  auth, database, storage,
  onAuthStateChanged, signOut,
  ref, onValue, serverTimestamp, push, set, update, remove
} from './firebase.js';

// عناصر DOM
const postsContainer = document.getElementById('posts-container');
const adminIcon = document.getElementById('admin-icon');
const authButtons = document.getElementById('auth-buttons');
const loadingOverlay = document.getElementById('loading-overlay');

// متغيرات النظام
let currentUserData = null;
let adminUsers = [];

// تحميل المنشورات عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    checkAuthState();
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, user => {
        if (user) {
            // تحميل بيانات المستخدم الحالي
            const userRef = ref(database, 'users/' + user.uid);
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    currentUserData = snapshot.val();
                    currentUserData.uid = user.uid;
                    
                    // تحديث واجهة المستخدم
                    updateUIForLoggedInUser();
                    
                    // تحميل المشرفين
                    loadAdminUsers();
                }
            });
        } else {
            // المستخدم غير مسجل
            updateUIForLoggedOutUser();
        }
    });
}

// تحديث الواجهة للمستخدم المسجل
function updateUIForLoggedInUser() {
    authButtons.innerHTML = `
        <button id="logout-btn" class="btn btn-outline">تسجيل الخروج</button>
    `;
    
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
    if (currentUserData && currentUserData.isAdmin) {
        adminIcon.style.display = 'flex';
    }
}

// تحديث الواجهة للمستخدم غير المسجل
function updateUIForLoggedOutUser() {
    authButtons.innerHTML = `
        <a href="auth.html" class="btn btn-outline">تسجيل الدخول</a>
    `;
    adminIcon.style.display = 'none';
}

// معالجة تسجيل الخروج
function handleLogout() {
    signOut(auth).then(() => {
        currentUserData = null;
        updateUIForLoggedOutUser();
        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload();
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// تحميل المشرفين
function loadAdminUsers() {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        adminUsers = [];
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (const userId in users) {
                if (users[userId].isAdmin) {
                    adminUsers.push(userId);
                }
            }
        }
    });
}

// تحميل المنشورات للجميع
function loadPosts() {
    showLoading();
    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        postsContainer.innerHTML = '';
        if (snapshot.exists()) {
            const posts = snapshot.val();
            const postsArray = [];
            
            for (const postId in posts) {
                postsArray.push({ id: postId, ...posts[postId] });
            }
            
            // ترتيب المنشورات حسب التاريخ (الأحدث أولاً)
            postsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            // عرض المنشورات
            postsArray.forEach(post => {
                const postCard = createPostCard(post);
                postsContainer.appendChild(postCard);
            });
        } else {
            postsContainer.innerHTML = '<p class="no-posts">لا توجد منشورات بعد</p>';
        }
        hideLoading();
    }, {
        onlyOnce: true
    });
}

// إنشاء بطاقة منشور
function createPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.innerHTML = `
        <div class="post-image">
            ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}" loading="lazy">` : 
            `<i class="fas fa-image"></i>`}
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-description">${post.description}</p>
            <div class="post-meta">
                <div class="post-price">${post.price || 'غير محدد'}</div>
                <div class="post-author">
                    <i class="fas fa-user"></i>
                    <span>${post.authorName || 'مستخدم'}</span>
                </div>
            </div>
        </div>
    `;
    
    postCard.addEventListener('click', () => {
        // حفظ المنشور في localStorage والانتقال إلى صفحة التفاصيل
        localStorage.setItem('currentPost', JSON.stringify(post));
        window.location.href = 'post-detail.html';
    });
    
    return postCard;
}

// وظائف مساعدة
function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}