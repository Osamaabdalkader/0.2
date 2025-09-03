// استيراد دوال Firebase
import { 
  auth, database, ref, set,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged 
} from './firebase.js';

// عناصر DOM
const authTabs = document.querySelector('.auth-tabs');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

// تغيير علامات التوثيق
authTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        if (e.target.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
        
        // إخفاء أي رسائل سابقة
        authMessage.classList.add('hidden');
    }
});

// تسجيل الدخول
loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAuthMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        showAuthMessage('تم تسجيل الدخول بنجاح!', 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد تسجيل الدخول
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showAuthMessage(getAuthErrorMessage(error.code), 'error');
    }
});

// إنشاء حساب
signupBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const address = document.getElementById('signup-address').value;
    
    if (!name || !phone || !email || !password) {
        showAuthMessage('يرجى ملء جميع الحقول الإلزامية', 'error');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // حفظ بيانات المستخدم الإضافية في قاعدة البيانات
        const userData = {
            name: name,
            phone: phone,
            email: email,
            address: address,
            createdAt: Date.now(),
            isAdmin: false
        };
        
        await set(ref(database, 'users/' + user.uid), userData);
        
        showAuthMessage('تم إنشاء الحساب بنجاح!', 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد إنشاء الحساب
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showAuthMessage(getAuthErrorMessage(error.code), 'error');
    }
});

// استمع لتغير حالة المستخدم
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('auth.html')) {
        // إذا كان المستخدم مسجلاً بالفعل، انتقل إلى الصفحة الرئيسية
        window.location.href = 'index.html';
    }
});

// وظائف مساعدة
function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = '';
    authMessage.classList.add(type + '-message');
    authMessage.classList.remove('hidden');
}

function getAuthErrorMessage(code) {
    switch(code) {
        case 'auth/invalid-email': return 'البريد الإلكتروني غير صالح';
        case 'auth/user-disabled': return 'هذا الحساب معطل';
        case 'auth/user-not-found': return 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني';
        case 'auth/wrong-password': return 'كلمة المرور غير صحيحة';
        case 'auth/email-already-in-use': return 'هذا البريد الإلكتروني مستخدم بالفعل';
        case 'auth/weak-password': return 'كلمة المرور ضعيفة (يجب أن تحتوي على 6 أحرف على الأقل)';
        default: return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
    }
}