// استيراد دوال Firebase
import { 
  auth, database,
  ref, onValue, update,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const ordersContainer = document.getElementById('orders-container');
const filterBtns = document.querySelectorAll('.filter-btn');
const adminIcon = document.getElementById('admin-icon');

// متغيرات النظام
let currentUserData = null;
let currentOrders = [];
let ordersListener = null;

// تحميل البيانات عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupEventListeners();
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
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                currentUserData = snapshot.val();
                currentUserData.uid = user.uid;
                
                // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
                if (currentUserData.isAdmin) {
                    adminIcon.style.display = 'flex';
                    loadOrders('all');
                } else {
                    // إذا لم يكن مشرفاً، توجيه إلى الصفحة الرئيسية
                    window.location.href = 'index.html';
                }
            }
        });
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // فلاتر الطلبات
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadOrders(btn.dataset.filter);
        });
    });
}




// تحميل الطلبات للإدارة
function loadOrders(filter = 'all') {
    if (ordersListener) {
        ordersListener();
    }
    
    ordersContainer.innerHTML = '<div class="loading-text">جاري تحميل الطلبات...</div>';
    
    const ordersRef = ref(database, 'orders');
    const orderedQuery = query(ordersRef, orderByChild('createdAt'));
    
    ordersListener = onValue(orderedQuery, (snapshot) => {
        ordersContainer.innerHTML = '';
        currentOrders = [];
        
        if (snapshot.exists()) {
            const orders = snapshot.val();
            const ordersArray = [];
            
            for (const orderId in orders) {
                const order = { id: orderId, ...orders[orderId] };
                
                if (filter === 'all' || order.status === filter) {
                    ordersArray.push(order);
                }
            }
            
            currentOrders = ordersArray;
            
            if (ordersArray.length > 0) {
                // ترتيب الطلبات من الأحدث إلى الأقدم
                ordersArray.sort((a, b) => {
                    const timeA = a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : a.createdAt * 1000) : 0;
                    const timeB = b.createdAt ? (typeof b.createdAt === 'number' ? b.createdAt : b.createdAt * 1000) : 0;
                    return timeB - timeA;
                });
                
                // تجميع الطلبات حسب المنشور
                const ordersByPost = groupOrdersByPost(ordersArray);
                
                ordersByPost.forEach(postOrders => {
                    const orderElement = createPostOrderItem(postOrders);
                    ordersContainer.appendChild(orderElement);
                });
            } else {
                ordersContainer.innerHTML = '<p class="no-orders">لا توجد طلبات</p>';
            }
        } else {
            ordersContainer.innerHTML = '<p class="no-orders">لا توجد طلبات</p>';
        }
    });
}

// إنشاء عنصر طلب مجمع حسب المنشور
function createPostOrderItem(postData) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    orderElement.dataset.postId = postData.postId;
    
    const statusCounts = {
        pending: postData.orders.filter(o => o.status === 'pending').length,
        approved: postData.orders.filter(o => o.status === 'approved').length,
        rejected: postData.orders.filter(o => o.status === 'rejected').length
    };
    
    orderElement.innerHTML = `
        <div class="order-header">
            <h3 class="order-title">${postData.postTitle}</h3>
            <span class="order-count">${postData.orders.length} طلب</span>
        </div>
        
        <div class="order-image">
            ${postData.postImage ? `
                <img src="${postData.postImage}" alt="${postData.postTitle}">
            ` : `
                <div class="no-image"><i class="fas fa-image"></i></div>
            `}
        </div>
        
        <div class="order-statuses">
            ${statusCounts.pending > 0 ? `
                <span class="status-badge status-pending">${statusCounts.pending} قيد الانتظار</span>
            ` : ''}
            ${statusCounts.approved > 0 ? `
                <span class="status-badge status-approved">${statusCounts.approved} مقبولة</span>
            ` : ''}
            ${statusCounts.rejected > 0 ? `
                <span class="status-badge status-rejected">${statusCounts.rejected} مرفوضة</span>
            ` : ''}
        </div>
        
        <div class="order-meta">
            <span>انقر لعرض التفاصيل</span>
        </div>
    `;
    
    orderElement.addEventListener('click', () => {
        localStorage.setItem('currentPostOrders', JSON.stringify(postData));
        window.location.href = 'order-detail.html';
    });
    
    return orderElement;
}       localStorage.setItem('currentPostOrders', JSON.stringify(postData));
        window.location.href = 'order-detail.html';
    });
    
    return orderElement;
}