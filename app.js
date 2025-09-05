// app.js - الإصدار الكامل بعد التعديل
import { 
    auth, database, storage, onAuthStateChanged, signOut, 
    ref, onValue, serverTimestamp, push, set, update, remove 
} from './firebase.js';

// عناصر DOM
const postsContainer = document.getElementById('posts-container');
const adminIcon = document.getElementById('admin-icon');
const loadingOverlay = document.getElementById('loading-overlay');
const uploadProgress = document.getElementById('upload-progress');
const notificationsIcon = document.getElementById('notifications-icon');
const profileHeaderIcon = document.getElementById('profile-header-icon');
const supportIcon = document.getElementById('support-icon');
const moreIcon = document.getElementById('more-icon');

// متغيرات النظام
let currentUserData = null;
let adminUsers = [];
let currentPosts = [];
let currentFilter = { type: '', location: '' };

// تحميل المنشورات عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    checkAuthState();
    initFiltersAndSearch();
    setupEventListeners();
    loadAdminUsers();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // أيقونة الإشعارات
    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', () => {
            alert('صفحة الإشعارات قيد التطوير');
        });
    }

    // أيقونة المزيد
    if (moreIcon) {
        moreIcon.addEventListener('click', handleMoreIconClick);
    }

    // أيقونة الدعم
    if (supportIcon) {
        supportIcon.addEventListener('click', handleSupportIconClick);
    }
}

// التعامل مع النقر على أيقونة المزيد
function handleMoreIconClick() {
    if (!currentUserData) {
        // إذا لم يكن المستخدم مسجلاً، انتقل إلى صفحة المصادقة
        window.location.href = 'auth.html';
    } else if (currentUserData.isAdmin) {
        // إذا كان المستخدم مشرفاً، انتقل إلى صفحة الطلبات
        window.location.href = 'orders.html';
    } else {
        // إذا كان المستخدم عاديًا، انتقل إلى صفحة المزيد
        window.location.href = 'more.html';
    }
}

// التعامل مع النقر على أيقونة الدعم
function handleSupportIconClick() {
    if (!currentUserData) {
        // إذا لم يكن المستخدم مسجلاً، انتقل إلى صفحة المصادقة
        window.location.href = 'auth.html';
    } else {
        // إذا كان المستخدم مسجلاً (عادي أو مشرف)، انتقل إلى صفحة الرسائل
        window.location.href = 'messages.html';
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
                    updateUIForLoggedInUser();
                }
            });
        } else {
            currentUserData = null;
            updateUIForLoggedOutUser();
        }
    });
}

// تحديث الواجهة للمستخدم المسجل
function updateUIForLoggedInUser() {
    // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
    if (currentUserData && currentUserData.isAdmin && adminIcon) {
        adminIcon.style.display = 'flex';
    }
}

// تحديث الواجهة للمستخدم غير المسجل
function updateUIForLoggedOutUser() {
    if (adminIcon) {
        adminIcon.style.display = 'none';
    }
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
        // ... (الكود الأصلي لتحميل المنشورات)
        hideLoading();
    }, (error) => {
        console.error('Error loading posts:', error);
        hideLoading();
    });
}

// إنشاء بطاقة منشور
function createPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.type = post.category || '';
    postCard.dataset.location = post.location || '';
    // ... (الكود الأصلي لإنشاء بطاقة المنشور)
    return postCard;
}

// تهيئة الفلاتر والبحث
function initFiltersAndSearch() {
    // البحث
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            filterPosts();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterPosts();
            }
        });
    }
}

// فلترة المنشورات
function filterPosts() {
    const searchInput = document.querySelector('.search-input');
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    const posts = document.querySelectorAll('.post-card');
    
    posts.forEach(post => {
        const postType = post.dataset.type || '';
        const postLocation = post.dataset.location || '';
        const postText = post.textContent.toLowerCase();
        
        const matchesSearch = searchText === '' || 
                             postType.includes(searchText) || 
                             postLocation.includes(searchText) || 
                             postText.includes(searchText);
        
        const matchesFilter = (!currentFilter.type || postType === currentFilter.type) &&
                             (!currentFilter.location || postLocation === currentFilter.location);
        
        if (matchesSearch && matchesFilter) {
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
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) {
        return 'الآن';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `منذ ${minutes} دقيقة`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `منذ ${hours} ساعة`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `منذ ${days} يوم`;
    }
}

// وظائف مساعدة
function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}
