// استيراد دوال Firebase
import { 
  auth, database,
  ref, onValue, update,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const orderDetailContent = document.getElementById('order-detail-content');
const orderActions = document.getElementById('order-actions');
const adminIcon = document.getElementById('admin-icon');

// متغيرات النظام
let currentUserData = null;
let currentPostOrders = null;

// تحميل البيانات عند بدء التحميل
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
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                currentUserData = snapshot.val();
                currentUserData.uid = user.uid;
                
                // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
                if (currentUserData.isAdmin) {
                    adminIcon.style.display = 'flex';
                    loadOrderDetails();
                } else {
                    // إذا لم يكن مشرفاً، توجيه إلى الصفحة الرئيسية
                    window.location.href = 'index.html';
                }
            }
        });
    });
}

// تحميل تفاصيل الطلب
function loadOrderDetails() {
    const postOrdersData = JSON.parse(localStorage.getItem('currentPostOrders'));
    
    if (!postOrdersData) {
        orderDetailContent.innerHTML = '<p class="error">لم يتم العثور على بيانات الطلب</p>';
        // العودة إلى صفحة الطلبات بعد ثانيتين
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 2000);
        return;
    }
    
    currentPostOrders = postOrdersData;
    displayOrderDetails(postOrdersData);
}





// عرض تفاصيل الطلب
function displayOrderDetails(postOrders) {
    orderDetailContent.innerHTML = '';
    orderActions.innerHTML = '';
    
    // عرض معلومات المنشور
    const postInfo = document.createElement('div');
    postInfo.className = 'order-detail-section';
    postInfo.innerHTML = `
        <h3>معلومات المنشور</h3>
        <div class="order-detail-item">
            <span class="order-detail-label">العنوان:</span>
            <span class="order-detail-value">${postOrders.postTitle}</span>
        </div>
        ${postOrders.postImage ? `
            <div class="order-detail-item">
                <span class="order-detail-label">الصورة:</span>
                <img src="${postOrders.postImage}" alt="صورة المنشور" class="order-image">
            </div>
        ` : ''}
    `;
    orderDetailContent.appendChild(postInfo);
    
    // عرض الطلبات الفردية
    const ordersList = document.createElement('div');
    ordersList.className = 'order-detail-section';
    ordersList.innerHTML = '<h3>الطلبات على هذا المنشور</h3>';
    
    // ترتيب الطلبات من الأحدث إلى الأقدم
    postOrders.orders.sort((a, b) => {
        const timeA = a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : a.createdAt * 1000) : 0;
        const timeB = b.createdAt ? (typeof b.createdAt === 'number' ? b.createdAt : b.createdAt * 1000) : 0;
        return timeB - timeA;
    });
    
    postOrders.orders.forEach(order => {
        const orderElement = createIndividualOrderItem(order);
        ordersList.appendChild(orderElement);
    });
    
    orderDetailContent.appendChild(ordersList);
}

// إنشاء عنصر طلب فردي
function createIndividualOrderItem(order) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item individual-order';
    orderElement.dataset.orderId = order.id;
    
    const buyerName = order.buyerName || 'مشتري';
    
    let statusClass = '';
    let statusText = '';
    
    switch(order.status) {
        case 'pending':
            statusClass = 'status-pending';
            statusText = 'قيد الانتظار';
            break;
        case 'approved':
            statusClass = 'status-approved';
            statusText = 'مقبول';
            break;
        case 'rejected':
            statusClass = 'status-rejected';
            statusText = 'مرفوض';
            break;
        default:
            statusClass = 'status-pending';
            statusText = order.status;
    }
    
    const orderDate = order.createdAt ? new Date(
        typeof order.createdAt === 'number' ? order.createdAt : order.createdAt * 1000
    ).toLocaleDateString('ar-EG') : 'غير معروف';
    
    orderElement.innerHTML = `
        <div class="order-header">
            <h3 class="order-title">طلب من ${buyerName}</h3>
            <span class="order-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="order-meta">
            <span>السعر: ${order.postPrice || 'غير محدد'}</span>
            <span>التاريخ: ${orderDate}</span>
        </div>
        
        <div class="order-details">
            <div class="detail-item">
                <strong>المشتري:</strong> ${buyerName}
            </div>
            <div class="detail-item">
                <strong>البائع:</strong> ${order.sellerName || 'بائع'}
            </div>
            <div class="detail-item">
                <strong>حالة الطلب:</strong> ${statusText}
            </div>
        </div>
        
        <div class="order-actions">
            ${order.status === 'pending' ? `
                <button class="btn btn-success approve-btn" data-order-id="${order.id}">قبول</button>
                <button class="btn btn-danger reject-btn" data-order-id="${order.id}">رفض</button>
            ` : ''}
            <button class="btn btn-primary chat-btn" data-order-id="${order.id}" data-user-id="${order.buyerId}">التحدث مع المشتري</button>
            <button class="btn btn-secondary chat-btn" data-order-id="${order.id}" data-user-id="${order.sellerId}">التحدث مع البائع</button>
        </div>
    `;
    
    // إضافة مستمعي الأحداث للأزرار
    const approveBtn = orderElement.querySelector('.approve-btn');
    const rejectBtn = orderElement.querySelector('.reject-btn');
    const chatBtns = orderElement.querySelectorAll('.chat-btn');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            approveOrder(order.id);
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            rejectOrder(order.id);
        });
    }
    
    chatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = btn.dataset.userId;
            const userType = btn.dataset.userId === order.buyerId ? 'المشتري' : 'البائع';
            openChat(userId, userType);
        });
    });
    
    return orderElement;
}

// فتح محادثة مع مستخدم
function openChat(userId, userType) {
    // حفظ بيانات المحادثة في localStorage
    const chatData = {
        userId: userId,
        userType: userType,
        isPrivateChat: true
    };
    
    localStorage.setItem('privateChat', JSON.stringify(chatData));
    window.location.href = 'messages.html';
}
// قبول الطلب
async function approveOrder(orderId) {
    try {
        await update(ref(database, 'orders/' + orderId), {
            status: 'approved',
            processedAt: Date.now(),
            processedBy: auth.currentUser.uid
        });
        
        alert('تم قبول الطلب بنجاح');
        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload();
    } catch (error) {
        console.error('Error approving order:', error);
        alert('حدث خطأ أثناء قبول الطلب. يرجى المحاولة مرة أخرى.');
    }
}

// رفض الطلب
async function rejectOrder(orderId) {
    try {
        await update(ref(database, 'orders/' + orderId), {
            status: 'rejected',
            processedAt: Date.now(),
            processedBy: auth.currentUser.uid
        });
        
        alert('تم رفض الطلب بنجاح');
        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload();
    } catch (error) {
        console.error('Error rejecting order:', error);
        alert('حدث خطأ أثناء رفض الطلب. يرجى المحاولة مرة أخرى.');
    }
}

// التحدث مع المشتري
function chatWithBuyer(buyerId) {
    // حفظ معرف المشتري والانتقال إلى صفحة الرسائل
    localStorage.setItem('chatWithUser', buyerId);
    window.location.href = 'messages.html';
}