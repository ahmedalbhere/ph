// مراجع قاعدة البيانات
let currentPharmacyRef;
let pharmacyOrdersRef;

// عناصر DOM
const adminLoginSection = document.querySelector('.admin-login-section');
const adminDashboard = document.querySelector('.admin-dashboard');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const saveDataBtn = document.getElementById('save-data-btn');
const toggleStatusBtn = document.getElementById('toggle-status-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const displayPharmacyName = document.getElementById('display-pharmacy-name');
const displayPharmacyCity = document.getElementById('display-pharmacy-city');
const displayPharmacyLocation = document.getElementById('display-pharmacy-location');
const drugsList = document.getElementById('drugs-list');
const ordersList = document.getElementById('orders-list');
const addDrugBtn = document.getElementById('add-drug-btn');
const newDrugInput = document.getElementById('new-drug');

// كائن الصيدلية الحالية
let currentPharmacy = null;

// تسجيل دخول الإدارة
adminLoginBtn.addEventListener('click', () => {
    const pharmacyName = document.getElementById('pharmacy-name').value;
    const pharmacyCity = document.getElementById('pharmacy-city').value;
    const pharmacyLocation = document.getElementById('pharmacy-location').value;
    const password = document.getElementById('admin-password').value;
    
    if (!pharmacyName || !pharmacyCity || !pharmacyLocation || !password) {
        alert('الرجاء إدخال جميع البيانات المطلوبة');
        return;
    }
    
    // تسجيل الدخول باستخدام Firebase Auth
    const email = `${pharmacyName.replace(/\s+/g, '')}@pharmacy.com`;
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // البحث عن الصيدلية في قاعدة البيانات
            const query = database.ref('pharmacies').orderByChild('name').equalTo(pharmacyName);
            query.once('value').then(snapshot => {
                if (snapshot.exists()) {
                    // الصيدلية موجودة
                    const pharmacyData = snapshot.val();
                    const pharmacyId = Object.keys(pharmacyData)[0];
                    
                    currentPharmacy = {
                        id: pharmacyId,
                        ...pharmacyData[pharmacyId]
                    };
                    
                    setupPharmacyDashboard();
                } else {
                    // إنشاء صيدلية جديدة
                    const newPharmacyRef = database.ref('pharmacies').push();
                    newPharmacyRef.set({
                        name: pharmacyName,
                        city: pharmacyCity,
                        location: pharmacyLocation,
                        isOpen: true,
                        drugs: {}
                    }).then(() => {
                        currentPharmacy = {
                            id: newPharmacyRef.key,
                            name: pharmacyName,
                            city: pharmacyCity,
                            location: pharmacyLocation,
                            isOpen: true,
                            drugs: {}
                        };
                        
                        setupPharmacyDashboard();
                    });
                }
            });
        })
        .catch((error) => {
            console.error('Login error:', error);
            alert('خطأ في تسجيل الدخول: ' + error.message);
        });
});

// إعداد لوحة التحكم للصيدلية
function setupPharmacyDashboard() {
    // حفظ بيانات الصيدلية في localStorage
    localStorage.setItem('pharmacyId', currentPharmacy.id);
    localStorage.setItem('pharmacyName', currentPharmacy.name);
    localStorage.setItem('pharmacyCity', currentPharmacy.city);
    localStorage.setItem('pharmacyLocation', currentPharmacy.location);
    localStorage.setItem('pharmacyStatus', currentPharmacy.isOpen ? 'open' : 'closed');
    
    // تهيئة المراجع
    currentPharmacyRef = database.ref('pharmacies/' + currentPharmacy.id);
    pharmacyOrdersRef = database.ref('orders').orderByChild('pharmacyId').equalTo(currentPharmacy.id);
    
    // عرض لوحة التحكم
    showAdminDashboard();
    
    // تحميل الأدوية والطلبات
    loadPharmacyDrugs();
    loadPharmacyOrders();
}

// عرض لوحة التحكم
function showAdminDashboard() {
    adminLoginSection.style.display = 'none';
    adminDashboard.style.display = 'block';
    
    // تعبئة بيانات الصيدلية
    displayPharmacyName.textContent = currentPharmacy.name;
    displayPharmacyCity.textContent = currentPharmacy.city;
    displayPharmacyLocation.textContent = currentPharmacy.location;
    
    // تعيين حالة الصيدلية
    if (currentPharmacy.isOpen) {
        statusIndicator.className = 'status-indicator status-open';
        statusText.textContent = 'مفتوحة';
        toggleStatusBtn.innerHTML = '<i class="fas fa-lock"></i> إغلاق الصيدلية';
    } else {
        statusIndicator.className = 'status-indicator status-closed';
        statusText.textContent = 'مغلقة';
        toggleStatusBtn.innerHTML = '<i class="fas fa-lock-open"></i> فتح الصيدلية';
    }
}

// تغيير حالة الصيدلية
toggleStatusBtn.addEventListener('click', () => {
    const newStatus = !currentPharmacy.isOpen;
    
    currentPharmacyRef.update({
        isOpen: newStatus
    }).then(() => {
        currentPharmacy.isOpen = newStatus;
        if (newStatus) {
            statusIndicator.className = 'status-indicator status-open';
            statusText.textContent = 'مفتوحة';
            toggleStatusBtn.innerHTML = '<i class="fas fa-lock"></i> إغلاق الصيدلية';
            localStorage.setItem('pharmacyStatus', 'open');
        } else {
            statusIndicator.className = 'status-indicator status-closed';
            statusText.textContent = 'مغلقة';
            toggleStatusBtn.innerHTML = '<i class="fas fa-lock-open"></i> فتح الصيدلية';
            localStorage.setItem('pharmacyStatus', 'closed');
        }
    }).catch(error => {
        console.error('Error updating status:', error);
        alert('حدث خطأ أثناء تحديث الحالة');
    });
});

// إضافة دواء جديد
addDrugBtn.addEventListener('click', () => {
    const drugName = newDrugInput.value.trim();
    
    if (!drugName) {
        alert('الرجاء إدخال اسم الدواء');
        return;
    }
    
    const newDrugRef = currentPharmacyRef.child('drugs').push();
    newDrugRef.set({
        name: drugName,
        quantity: 1,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        newDrugInput.value = '';
    }).catch(error => {
        console.error('Error adding drug:', error);
        alert('حدث خطأ أثناء إضافة الدواء');
    });
});

// تحميل أدوية الصيدلية
function loadPharmacyDrugs() {
    currentPharmacyRef.child('drugs').on('value', snapshot => {
        drugsList.innerHTML = '';
        
        if (!snapshot.exists()) {
            drugsList.innerHTML = '<div class="no-drugs">لا توجد أدوية مضاف</div>';
            return;
        }
        
        snapshot.forEach(drugSnap => {
            const drug = drugSnap.val();
            const drugItem = document.createElement('div');
            drugItem.className = 'drug-item';
            drugItem.innerHTML = `
                <span class="drug-name">${drug.name}</span>
                <button class="remove-drug" data-drug-id="${drugSnap.key}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            drugsList.appendChild(drugItem);
        });
        
        // إضافة حدث لحذف الأدوية
        document.querySelectorAll('.remove-drug').forEach(btn => {
            btn.addEventListener('click', function() {
                const drugId = this.getAttribute('data-drug-id');
                currentPharmacyRef.child('drugs/' + drugId).remove()
                    .catch(error => {
                        console.error('Error removing drug:', error);
                        alert('حدث خطأ أثناء حذف الدواء');
                    });
            });
        });
    });
}

// تحميل طلبات الصيدلية
function loadPharmacyOrders() {
    pharmacyOrdersRef.on('value', snapshot => {
        ordersList.innerHTML = '';
        
        if (!snapshot.exists()) {
            ordersList.innerHTML = '<div class="no-orders"><i class="fas fa-info-circle"></i> لا توجد طلبات حالية</div>';
            return;
        }
        
        snapshot.forEach(orderSnap => {
            const order = orderSnap.val();
            if (order.status === 'pending') {
                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                orderCard.innerHTML = `
                    <div class="order-info">
                        <h4>${order.drugName}</h4>
                        <p class="order-client">${order.clientName} - ${new Date(order.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div class="order-actions">
                        <div class="action-btn approve-btn" data-order-id="${orderSnap.key}">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="action-btn reject-btn" data-order-id="${orderSnap.key}">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                `;
                
                ordersList.appendChild(orderCard);
            }
        });
        
        // إضافة أحداث للطلبات
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.getAttribute('data-order-id');
                database.ref('orders/' + orderId).update({
                    status: 'approved',
                    approvedAt: firebase.database.ServerValue.TIMESTAMP
                }).then(() => {
                    alert('تمت الموافقة على الطلب');
                }).catch(error => {
                    console.error('Error approving order:', error);
                    alert('حدث خطأ أثناء الموافقة على الطلب');
