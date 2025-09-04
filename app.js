// app.js - الإصدار الكامل بعد التعديل
import { 
  auth, database, storage,
  onAuthStateChanged, signOut,
  ref, onValue, serverTimestamp, push, set, update, remove
} from './firebase.js';

// عناصر DOM
const postsContainer = document.getElementById('posts-container');
const adminIcon = document.getElementById('admin-icon');
const loadingOverlay = document.getElementById('loading-overlay');
const uploadProgress = document.getElementById('upload-progress');
const notificationsIcon = document.getElementById('notifications-icon');
const profileHeaderIcon = document.getElementById('profile-header-icon');

// متغيرات النظام
let currentUserData = null;
let adminUsers = [];
let currentPosts = [];
let currentFilter = {
    type: '',
    location: ''
};

// تحميل المنشورات عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    checkAuthState();
    initFiltersAndSearch();
    setupEventListeners();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // أيقونة الإشعارات
    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', () => {
            alert('صفحة الإشعارات قيد التطوير');
        });
    }
    
    // أيقونة الملف الشخصي في الهيدر
    if (profileHeaderIcon) {
        profileHeaderIcon.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                window.location.href = 'profile.html';
            } else {
                window.location.href = 'auth.html';
            }
        });
    }
}

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
    // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
    if (currentUserData && currentUserData.isAdmin) {
        adminIcon.style.display = 'flex';
    }
}

// تحديث الواجهة للمستخدم غير المسجل
function updateUIForLoggedOutUser() {
    adminIcon.style.display = 'none';
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
        currentPosts = [];
        
        if (snapshot.exists()) {
            const posts = snapshot.val();
            const postsArray = [];
            
            for (const postId in posts) {
                postsArray.push({ id: postId, ...posts[postId] });
            }
            
            // ترتيب المنشورات حسب التاريخ (الأحدث أولاً)
            postsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            currentPosts = postsArray;
            
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
    postCard.dataset.type = post.category || '';
    postCard.dataset.location = post.location || '';
    
    // تقييد الوصف إلى سطرين
    const shortDescription = post.description && post.description.length > 100 ? 
        post.description.substring(0, 100) + '...' : post.description;
    
    // حساب المدة المنقضية منذ النشر
    const timeAgo = formatTimeAgo(post.createdAt);
    
    postCard.innerHTML = `
        <div class="post-image">
            ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}" loading="lazy">` : 
            `<i class="fas fa-image"></i>`}
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-description">${shortDescription}</p>
            <div class="post-meta">
                <div class="post-time">${timeAgo}</div>
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

// تهيئة الفلاتر والبحث
function initFiltersAndSearch() {
    // البحث
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', filterPosts);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                filterPosts();
            }
        });
    }
    
    // الفلاتر
    const typeFilter = document.querySelector('.filter-category select');
    const locationFilter = document.querySelector('.filter-location select');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            currentFilter.type = typeFilter.value;
            filterPosts();
        });
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            currentFilter.location = locationFilter.value;
            filterPosts();
        });
    }
}

// فلترة المنشورات
function filterPosts() {
    const searchInput = document.querySelector('.search-input');
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    const posts = document.querySelectorAll('.post-card');
    
    posts.forEach(post => {
        const title = post.querySelector('.post-title').textContent.toLowerCase();
        const description = post.querySelector('.post-description').textContent.toLowerCase();
        const type = post.dataset.type || '';
        const location = post.dataset.location || '';
        
        const matchesSearch = !searchText || 
                             title.includes(searchText) || 
                             description.includes(searchText);
        
        const matchesType = !currentFilter.type || type === currentFilter.type;
        const matchesLocation = !currentFilter.location || location === currentFilter.location;
        
        if (matchesSearch && matchesType && matchesLocation) {
            post.style.display = 'block';
        } else {
            post.style.display = 'none';
        }
    });
}

// دالة لتنسيق الوقت المنقضي
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'غير معروف';
    
    const now = new Date();
    let postDate;
    
    // معالجة تنسيقات التاريخ المختلفة
    if (typeof timestamp === 'object' && timestamp.seconds) {
        // إذا كان timestamp من Firebase
        postDate = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'number') {
        // إذا كان timestamp رقمي
        postDate = new Date(timestamp);
    } else {
        return 'غير معروف';
    }
    
    const diff = now - postDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return postDate.toLocaleDateString('ar-EG');
}

// وظائف مساعدة
function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
      }
