// تهيئة مراجع Firebase
const pharmaciesRef = database.ref('pharmacies');
const ordersRef = database.ref('orders');
const clientsRef = database.ref('clients');

// عناصر DOM
const clientLoginSection = document.querySelector('.client-login-section');
const clientSearchSection = document.querySelector('.client-search-section');
const clientLoginBtn = document.getElementById('client-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const searchBtn = document.getElementById('search-btn');
const displayClientName = document.getElementById('display-client-name');
const pharmaciesList = document.getElementById('pharmacies-list');

// تسجيل دخول العميل
clientLoginBtn.addEventListener('click', () => {
    const clientName = document.getElementById('client-name').value;
    const clientPhone = document.getElementById('client-phone').value;
    
    if (!clientName || !clientPhone) {
        alert('الرجاء إدخال الاسم ورقم الهاتف');
        return;
    }
    
    // حفظ بيانات العميل
    const newClientRef = clientsRef.push();
    newClientRef.set({
        name: clientName,
        phone: clientPhone,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        localStorage.setItem('clientId', newClientRef.key);
        localStorage.setItem('clientName', clientName);
        localStorage.setItem('clientPhone', clientPhone);
        
        clientLoginSection.style.display = 'none';
        clientSearchSection.style.display = 'block';
        displayClientName.textContent = clientName;
    }).catch(error => {
        console.error('Error saving client:', error);
        alert('حدث خطأ أثناء حفظ البيانات');
    });
});

// تسجيل خروج العميل
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientName');
    localStorage.removeItem('clientPhone');
    clientLoginSection.style.display = 'block';
    clientSearchSection.style.display = 'none';
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
});

// البحث عن دواء
searchBtn.addEventListener('click', () => {
    const searchTerm = document.getElementById('drug-search').value.trim();
    
    if (!searchTerm) {
        alert('الرجاء إدخال اسم الدواء للبحث');
        return;
    }
    
    searchDrug(searchTerm);
});

// دالة البحث عن الدواء
function searchDrug(drugName) {
    pharmaciesRef.once('value').then(snapshot => {
        const results = [];
        snapshot.forEach(pharmacySnap => {
            const pharmacy = pharmacySnap.val();
            if (pharmacy.drugs && pharmacy.isOpen) {
                const hasDrug = Object.values(pharmacy.drugs).some(drug => 
                    drug.name.toLowerCase().includes(drugName.toLowerCase())
                );
                
                if (hasDrug) {
                    results.push({
                        id: pharmacySnap.key,
                        ...pharmacy
                    });
                }
            }
        });
        
        displayResults(results, drugName);
    }).catch(error => {
        console.error('Error searching drugs:', error);
        alert('حدث خطأ أثناء البحث');
    });
}

// عرض نتائج البحث
function displayResults(results, drugName) {
    pharmaciesList.innerHTML = '';
    
    if (results.length === 0) {
        pharmaciesList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-info-circle"></i> لا توجد صيدليات متاحة تحتوي على "${drugName}"
            </div>
        `;
        return;
    }
    
    results.forEach(pharmacy => {
        const pharmacyCard = document.createElement('div');
        pharmacyCard.className = `pharmacy-card ${pharmacy.isOpen ? 'available' : ''}`;
        
        pharmacyCard.innerHTML = `
            <div class="availability-icon ${pharmacy.isOpen ? 'available-icon' : ''}">
                <i class="fas ${pharmacy.isOpen ? 'fa-check' : 'fa-times'}"></i>
            </div>
            <div class="pharmacy-info">
                <div class="pharmacy-name">${pharmacy.name}</div>
                <div class="pharmacy-location">
                    <i class="fas fa-map-marker-alt location-icon"></i>
                    ${pharmacy.location}، ${pharmacy.city}
                </div>
                ${pharmacy.isOpen ? 
                    `<div class="drug-available"><i class="fas fa-check-circle"></i> متوفر: ${drugName}</div>
                    <button class="btn btn-primary request-btn" data-pharmacy-id="${pharmacy.id}" data-drug-name="${drugName}">
                        <i class="fas fa-paper-plane"></i> طلب الدواء
                    </button>` : 
                    '<div class="drug-not-available"><i class="fas fa-times-circle"></i> الصيدلية مغلقة حالياً</div>'}
            </div>
        `;
        
        pharmaciesList.appendChild(pharmacyCard);
    });
    
    // إضافة حدث لزر الطلب
    document.querySelectorAll('.request-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const pharmacyId = this.getAttribute('data-pharmacy-id');
            const drugName = this.getAttribute('data-drug-name');
            const clientId = localStorage.getItem('clientId');
            const clientName = localStorage.getItem('clientName');
            
            if (!clientId) {
                alert('الرجاء تسجيل الدخول أولاً');
                return;
            }
            
            // إنشاء طلب جديد
            const newOrderRef = ordersRef.push();
            newOrderRef.set({
                pharmacyId: pharmacyId,
                drugName: drugName,
                clientId: clientId,
                clientName: clientName,
                status: 'pending',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                alert('تم إرسال طلبك بنجاح! سيتم إعلامك عند الموافقة');
            }).catch(error => {
                console.error('Error creating order:', error);
                alert('حدث خطأ أثناء إرسال الطلب');
            });
        });
    });
}

// التحقق من تسجيل الدخول عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    const clientName = localStorage.getItem('clientName');
    const clientId = localStorage.getItem('clientId');
    
    if (clientName && clientId) {
        clientLoginSection.style.display = 'none';
        clientSearchSection.style.display = 'block';
        displayClientName.textContent = clientName;
    }
});
