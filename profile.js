// استيراد دوال Firebase
import { 
  auth, database, signOut,
  ref, onValue,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userPhone = document.getElementById('user-phone');
const userAddress = document.getElementById('user-address');
const logoutBtn = document.getElementById('logout-btn');
const adminIcon = document.getElementById('admin-icon');

// تحميل بيانات المستخدم عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, user => {
        if (!user) {
            // توجيه إلى صفحة التسجيل إذا لم يكن المستخدم مسجلاً
            window.location.href = 'auth.html';
            return;
        }
        
        // تحميل بيانات المستخدم الحالي
        loadUserData(user.uid);
    });
}

// تحميل بيانات المستخدم
function loadUserData(userId) {
    const userRef = ref(database, 'users/' + userId);
    onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // عرض بيانات المستخدم
            userName.textContent = userData.name || 'غير محدد';
            userEmail.textContent = userData.email || 'غير محدد';
            userPhone.textContent = userData.phone || 'غير محدد';
            userAddress.textContent = userData.address || 'غير محدد';
            
            // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
            if (userData.isAdmin) {
                adminIcon.style.display = 'flex';
            }
        } else {
            // بيانات المستخدم غير موجودة
            userName.textContent = 'بيانات غير متاحة';
            userEmail.textContent = 'بيانات غير متاحة';
            userPhone.textContent = 'بيانات غير متاحة';
            userAddress.textContent = 'بيانات غير متاحة';
        }
    });
}

// تسجيل الخروج
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        // توجيه إلى الصفحة الرئيسية بعد تسجيل الخروج
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
        alert('حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.');
    });
});
