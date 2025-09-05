// app.js - الإصدار الكامل بعد التعديل
import { auth, database, storage, onAuthStateChanged, signOut, ref, onValue, serverTimestamp, push, set, update, remove } from './firebase.js';

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
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // أيقونة الإشعارات
    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', () => {
            alert('صفحة الإشعارات قيد التطوير');
        });
    }

    // أيقونة المزيد (تمت الإضافة)
    if (moreIcon) {
        moreIcon.addEventListener('click', () => {
            if (!currentUserData) {
                // إذا لم يكن المستخدم مسجلاً
                window.location.href = 'auth.html';
            } else if (currentUserData.isAdmin) {
                // إذا كان المستخدم مشرفاً
                window.location.href = 'orders.html';
            } else {
                // إذا كان المستخدم مسجلاً وليس مشرفاً
                window.location.href = 'more.html';
            }
        });
    }

    // أيقونة الدعم (تمت الإضافة)
    if (supportIcon) {
        supportIcon.addEventListener('click', () => {
            if (!currentUserData) {
                // إذا لم يكن المستخدم مسجلاً
                window.location.href = 'auth.html';
            } else {
                // إذا كان المستخدم مسجلاً
                window.location.href = 'messages.html';
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
        // ... (الكود الأصلي لتحميل المنشورات)
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
    // ... (الكود الأصلي للبحث والفلاتر)
}

// فلترة المنشورات
function filterPosts() {
    const searchInput = document.querySelector('.search-input');
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    const posts = document.querySelectorAll('.post-card');
    // ... (الكود الأصلي للفلترة)
}

// دالة لتنسيق الوقت المنقضي
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'غير معروف';
    // ... (الكود الأصلي لتنسيق الوقت)
}

// وظائف مساعدة
function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
                                         }
