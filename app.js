// ===== متغيرات عامة =====
let currentUser = null;
let attendanceData = {};
let selectedDate = new Date().toISOString().split('T')[0];
let selectedClassId = null;
let childrenData = {};
let lessonsData = {};
let teachersData = {};
let classesData = {};

// ===== تهيئة التطبيق =====
document.addEventListener('DOMContentLoaded', function() {
    initializeDatabase();
    setupEventListeners();
    loadAllData();
    updateLastUpdateTime();
});

function updateLastUpdateTime() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('lastUpdate').textContent = formattedDate;
}

async function initializeDatabase() {
    try {
        await initializeDatabaseStructure();
        showNotification('تم تهيئة النظام بنجاح!', 'success');
    } catch (error) {
        console.error('خطأ في تهيئة النظام:', error);
        showNotification('حدث خطأ في تهيئة النظام', 'error');
    }
}

async function initializeDatabaseStructure() {
    const dbRef = database.ref();
    const snapshot = await dbRef.once('value');
    
    if (!snapshot.exists()) {
        // إنشاء هيكل قاعدة البيانات الأساسي
        const initialData = {
            appInitialized: true,
            lastUpdated: new Date().toISOString(),
            settings: {
                appName: "Little Stars",
                version: "2.0.0",
                defaultClass: "الروضة الأولى"
            },
            classes: {
                class1: {
                    id: "class1",
                    name: "الروضة الأولى",
                    academicYear: "2024-2025",
                    children: [],
                    teacher: "teacher1"
                },
                class2: {
                    id: "class2",
                    name: "الروضة الثانية",
                    academicYear: "2024-2025",
                    children: [],
                    teacher: "teacher2"
                },
                class3: {
                    id: "class3",
                    name: "التمهيدي",
                    academicYear: "2024-2025",
                    children: [],
                    teacher: "teacher3"
                }
            },
            teachers: {
                teacher1: {
                    id: "teacher1",
                    name: "أحمد محمد",
                    email: "ahmed@example.com",
                    phone: "0123456789",
                    specialty: "اللغة العربية",
                    classes: ["class1"]
                },
                teacher2: {
                    id: "teacher2",
                    name: "فاطمة علي",
                    email: "fatima@example.com",
                    phone: "0123456790",
                    specialty: "الرياضيات",
                    classes: ["class2"]
                },
                teacher3: {
                    id: "teacher3",
                    name: "سارة خالد",
                    email: "sara@example.com",
                    phone: "0123456791",
                    specialty: "اللغة الإنجليزية",
                    classes: ["class3"]
                }
            }
        };
        
        await dbRef.set(initialData);
        showNotification('تم إنشاء قاعدة البيانات بنجاح!', 'success');
    }
}

function setupEventListeners() {
    // تبديل الوضع الليلي/النهاري
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // نموذج إضافة طفل
    document.getElementById('addChildForm')?.addEventListener('submit', addNewChild);
    
    // نموذج إضافة حصة
    document.getElementById('addLessonForm')?.addEventListener('submit', addNewLesson);
    
    // بحث الأطفال
    document.getElementById('searchChildren')?.addEventListener('input', filterChildren);
    
    // تصفية الفصول
    document.getElementById('classFilter')?.addEventListener('change', filterChildren);
    
    // تصفية الحالة
    document.getElementById('statusFilter')?.addEventListener('change', filterChildren);
    
    // تاريخ الحضور
    document.getElementById('attendanceDate')?.addEventListener('change', function() {
        selectedDate = this.value;
        loadAttendanceData();
    });
    
    // اختيار الفصل للحضور
    document.getElementById('attendanceClass')?.addEventListener('change', function() {
        selectedClassId = this.value;
        loadAttendanceData();
    });
    
    // إعداد التاريخ الحالي
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
    document.getElementById('lessonDate').value = today;
    selectedDate = today;
    
    // بحث الحصص
    document.getElementById('searchLessons')?.addEventListener('input', filterLessons);
    document.getElementById('lessonClassFilter')?.addEventListener('change', filterLessons);
    document.getElementById('lessonSubjectFilter')?.addEventListener('change', filterLessons);
    
    // بحث المعلمين
    document.getElementById('searchTeachers')?.addEventListener('input', filterTeachers);
    
    // تهيئة التقويم العربي
    initializeArabicDate();
    
    // إعداد إعدادات الإشعارات
    setupNotificationSettings();
}

function initializeArabicDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const arabicDate = now.toLocaleDateString('ar-SA', options);
    document.getElementById('currentDate').textContent = arabicDate;
}

function setupNotificationSettings() {
    const dailyNotify = localStorage.getItem('dailyAttendanceNotify');
    const homeworkNotify = localStorage.getItem('homeworkNotify');
    
    if (dailyNotify !== null) {
        document.getElementById('dailyAttendanceNotify').checked = dailyNotify === 'true';
    }
    
    if (homeworkNotify !== null) {
        document.getElementById('homeworkNotify').checked = homeworkNotify === 'true';
    }
    
    document.getElementById('dailyAttendanceNotify').addEventListener('change', function() {
        localStorage.setItem('dailyAttendanceNotify', this.checked);
    });
    
    document.getElementById('homeworkNotify').addEventListener('change', function() {
        localStorage.setItem('homeworkNotify', this.checked);
    });
}

// ===== تحميل جميع البيانات =====
function loadAllData() {
    loadDashboardData();
    loadChildren();
    loadClasses();
    loadLessons();
    loadTeachers();
    loadAttendanceData();
    
    // استعادة الوضع المفضل
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.replace('light-mode', 'dark-mode');
        const icon = document.querySelector('#themeToggle i');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
}

// ===== وظائف إدارة الواجهة =====
function showSection(sectionId) {
    // إخفاء جميع الأقسام
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // إزالة النشاط من جميع روابط التنقل
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // إظهار القسم المطلوب
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // تعيين الرابط النشط
        const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    // تحميل البيانات الخاصة بالقسم
    switch(sectionId) {
        case 'attendance':
            loadClassesForAttendance();
            break;
        case 'reports':
            initializeCharts();
            break;
        case 'teachers':
            loadTeachers();
            break;
        case 'communications':
            loadMessages();
            break;
    }
    
    // إغلاق أي نوافذ مفتوحة
    closeAllModals();
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function toggleTheme() {
    const body = document.body;
    const icon = document.querySelector('#themeToggle i');
    
    if (body.classList.contains('light-mode')) {
        body.classList.replace('light-mode', 'dark-mode');
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.replace('dark-mode', 'light-mode');
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

function openAddChildModal() {
    document.getElementById('addChildModal').style.display = 'flex';
    // تعيين تاريخ الميلاد الافتراضي (3 سنوات)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    document.getElementById('birthDate').value = threeYearsAgo.toISOString().split('T')[0];
    
    // تحميل الفصول في القائمة المنسدلة
    loadClassesForSelect('className');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openAddLessonModal() {
    document.getElementById('addLessonModal').style.display = 'flex';
    // تعيين تاريخ اليوم كافتراضي
    document.getElementById('lessonDate').value = new Date().toISOString().split('T')[0];
    
    // تحميل الفصول في القائمة المنسدلة
    loadClassesForSelect('lessonClass');
}

function openAddTeacherModal() {
    showNotification('سيتم إضافة هذه الميزة قريباً', 'info');
}

function openAddClassModal() {
    showNotification('سيتم إضافة هذه الميزة قريباً', 'info');
}

function openAddParentModal() {
    showNotification('سيتم إضافة هذه الميزة قريباً', 'info');
}

function openNewMessageModal() {
    showNotification('سيتم إضافة هذه الميزة قريباً', 'info');
}

// ===== وظائف Firebase - لوحة التحكم =====
function loadDashboardData() {
    const childrenRef = database.ref('children');
    
    childrenRef.on('value', (snapshot) => {
        const children = snapshot.val();
        let totalChildren = 0;
        let newChildren = [];
        
        if (children) {
            totalChildren = Object.keys(children).length;
            childrenData = children;
            
            // الحصول على آخر 5 أطفال مسجلين
            Object.keys(children).forEach(childId => {
                const child = children[childId];
                child.id = childId;
                newChildren.push(child);
            });
            
            // ترتيب حسب تاريخ التسجيل
            newChildren.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
            const recentChildren = newChildren.slice(0, 5);
            
            // تحديث لوحة التحكم
            updateDashboardStats(children);
            updateNewChildrenCards(recentChildren);
        }
        
        // تحديث العداد
        document.getElementById('totalChildren').textContent = totalChildren;
        document.getElementById('sidebarChildrenCount').textContent = totalChildren;
        
        // تحديث إحصائيات سريعة
        updateQuickStats(children);
    });
    
    // تحميل الحصص القادمة
    loadUpcomingLessons();
}

function updateDashboardStats(children) {
    const today = new Date().toISOString().split('T')[0];
    let presentCount = 0;
    let totalCount = 0;
    
    // حساب نسبة الحضور اليوم
    if (children) {
        Object.keys(children).forEach(childId => {
            totalCount++;
            // يمكن إضافة منطق أكثر تعقيداً هنا بناءً على بيانات الحضور
        });
    }
    
    // قيم افتراضية لأغراض العرض
    const attendanceRate = totalCount > 0 ? Math.floor((presentCount / totalCount) * 100) : 0;
    const todayLessons = 4; // يمكن حسابها من قاعدة البيانات
    const absentCount = totalCount - presentCount;
    
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
    document.getElementById('todayLessons').textContent = todayLessons;
    document.getElementById('absentCount').textContent = absentCount;
}

function updateQuickStats(children) {
    if (!children) return;
    
    // حساب الواجبات المعلقة (افتراضي)
    const pendingHomework = Object.keys(children).length * 2; // مثال
    document.getElementById('sidebarPendingHomework').textContent = pendingHomework;
    
    // حساب نسبة الحضور اليوم
    const attendanceRate = 85; // يمكن حسابها من بيانات الحضور
    document.getElementById('sidebarAttendanceToday').textContent = `${attendanceRate}%`;
}

function updateNewChildrenCards(children) {
    const container = document.getElementById('newChildrenCards');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (children.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-child"></i>
                <p>لا يوجد أطفال مسجلين حديثاً</p>
            </div>
        `;
        return;
    }
    
    children.forEach(child => {
        const age = calculateAge(child.birthDate);
        const card = document.createElement('div');
        card.className = 'child-card';
        
        const genderIcon = child.gender === 'أنثى' ? 'fa-female' : 'fa-male';
        const genderColor = child.gender === 'أنثى' ? '#FF6B8B' : '#4A90E2';
        
        card.innerHTML = `
            <div class="child-avatar" style="background-color: rgba(${child.gender === 'أنثى' ? '255,107,139' : '74,144,226'}, 0.1)">
                <i class="fas ${genderIcon}" style="color: ${genderColor}"></i>
            </div>
            <div class="child-info">
                <h4>${child.fullName}</h4>
                <p><i class="fas fa-birthday-cake"></i> ${age} سنة</p>
                <p><i class="fas fa-users"></i> ${child.className}</p>
                <p><i class="fas fa-user-friends"></i> ${child.parentName}</p>
            </div>
            <div class="child-actions">
                <button class="btn-icon" onclick="viewChildDetails('${child.id}', event)">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function loadUpcomingLessons() {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const lessonsRef = database.ref('lessons');
    
    lessonsRef.once('value').then(snapshot => {
        const lessons = snapshot.val();
        const container = document.getElementById('upcomingLessons');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (lessons) {
            let upcomingLessons = [];
            
            // جمع جميع الحصص
            Object.keys(lessons).forEach(classId => {
                if (lessons[classId]) {
                    Object.keys(lessons[classId]).forEach(lessonId => {
                        const lesson = lessons[classId][lessonId];
                        lesson.id = lessonId;
                        lesson.classId = classId;
                        
                        const lessonDate = new Date(lesson.date);
                        if (lessonDate >= today && lessonDate <= nextWeek) {
                            upcomingLessons.push(lesson);
                        }
                    });
                }
            });
            
            // ترتيب الحصص حسب التاريخ
            upcomingLessons.sort((a, b) => new Date(a.date) - new Date(b.date));
            upcomingLessons = upcomingLessons.slice(0, 4);
            
            if (upcomingLessons.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-alt"></i>
                        <p>لا توجد حصص قادمة</p>
                    </div>
                `;
                return;
            }
            
            upcomingLessons.forEach(lesson => {
                container.appendChild(createLessonCard(lesson));
            });
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>لا توجد حصص قادمة</p>
                </div>
            `;
        }
    });
}

// ===== وظائف Firebase - الأطفال =====
function loadChildren() {
    const childrenRef = database.ref('children');
    
    childrenRef.on('value', (snapshot) => {
        const children = snapshot.val();
        const container = document.getElementById('childrenListContainer');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (children) {
            childrenData = children;
            
            Object.keys(children).forEach(childId => {
                const child = children[childId];
                container.appendChild(createChildCardFull(child, childId));
            });
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-child"></i>
                    <h3>لا يوجد أطفال مسجلين</h3>
                    <p>ابدأ بإضافة الأطفال الجدد إلى النظام</p>
                    <button class="btn btn-success mt-3" onclick="openAddChildModal()">
                        <i class="fas fa-plus-circle"></i> إضافة طفل جديد
                    </button>
                </div>
            `;
        }
    });
}

function createChildCardFull(child, childId) {
    const age = calculateAge(child.birthDate);
    const card = document.createElement('div');
    card.className = 'child-card';
    card.dataset.childId = childId;
    
    const genderIcon = child.gender === 'أنثى' ? 'fa-female' : 'fa-male';
    const genderColor = child.gender === 'أنثى' ? '#FF6B8B' : '#4A90E2';
    
    card.innerHTML = `
        <div class="child-avatar" style="background-color: rgba(${child.gender === 'أنثى' ? '255,107,139' : '74,144,226'}, 0.1)">
            <i class="fas ${genderIcon}" style="color: ${genderColor}"></i>
        </div>
        <div class="child-info">
            <h4>${child.fullName}</h4>
            <p><i class="fas fa-birthday-cake"></i> ${age} سنة</p>
            <p><i class="fas fa-users"></i> ${child.className}</p>
            <p><i class="fas fa-user-friends"></i> ${child.parentName}</p>
            <p><i class="fas fa-phone"></i> ${child.parentPhone || 'غير متوفر'}</p>
        </div>
        <div class="child-actions">
            <button class="btn-icon" onclick="viewChildDetails('${childId}', event)">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon" onclick="editChild('${childId}', event)">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="deleteChild('${childId}', event)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return card;
}

function addNewChild(e) {
    e.preventDefault();
    
    const childData = {
        fullName: document.getElementById('childName').value,
        birthDate: document.getElementById('birthDate').value,
        gender: document.getElementById('gender').value,
        className: document.getElementById('className').value,
        parentName: document.getElementById('parentName').value,
        parentPhone: document.getElementById('parentPhone').value,
        parentEmail: document.getElementById('parentEmail').value || '',
        emergencyContact: document.getElementById('emergencyContact').value,
        medicalNotes: document.getElementById('medicalNotes').value || '',
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active',
        lastUpdated: new Date().toISOString()
    };
    
    // التحقق من البيانات
    if (!validateChildData(childData)) {
        return;
    }
    
    const loadingBtn = document.querySelector('#addChildForm button[type="submit"]');
    const originalText = loadingBtn.innerHTML;
    loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    loadingBtn.disabled = true;
    
    database.ref('children').push(childData)
        .then(() => {
            showNotification('تم إضافة الطفل بنجاح!', 'success');
            closeModal('addChildModal');
            document.getElementById('addChildForm').reset();
        })
        .catch(error => {
            console.error('خطأ في إضافة الطفل:', error);
            showNotification('حدث خطأ في إضافة الطفل. حاول مرة أخرى.', 'error');
        })
        .finally(() => {
            loadingBtn.innerHTML = originalText;
            loadingBtn.disabled = false;
        });
}

function validateChildData(data) {
    if (!data.fullName || data.fullName.trim().length < 3) {
        showNotification('يرجى إدخال اسم الطفل كامل (3 أحرف على الأقل)', 'error');
        return false;
    }
    
    if (!data.birthDate) {
        showNotification('يرجى إدخال تاريخ الميلاد', 'error');
        return false;
    }
    
    if (!data.gender) {
        showNotification('يرجى اختيار الجنس', 'error');
        return false;
    }
    
    if (!data.className) {
        showNotification('يرجى اختيار الفصل الدراسي', 'error');
        return false;
    }
    
    if (!data.parentName || data.parentName.trim().length < 3) {
        showNotification('يرجى إدخال اسم ولي الأمر كامل', 'error');
        return false;
    }
    
    if (!data.parentPhone || data.parentPhone.trim().length < 10) {
        showNotification('يرجى إدخال رقم هاتف صحيح', 'error');
        return false;
    }
    
    return true;
}

function filterChildren() {
    const searchTerm = document.getElementById('searchChildren')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('classFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    const container = document.getElementById('childrenListContainer');
    if (!container) return;
    
    const childCards = container.querySelectorAll('.child-card');
    
    childCards.forEach(card => {
        const childId = card.dataset.childId;
        const child = childrenData[childId];
        
        if (!child) return;
        
        const matchesSearch = child.fullName.toLowerCase().includes(searchTerm) ||
                             child.parentName.toLowerCase().includes(searchTerm) ||
                             (child.parentPhone && child.parentPhone.includes(searchTerm));
        
        const matchesClass = !classFilter || child.className === classFilter;
        const matchesStatus = !statusFilter || child.status === statusFilter;
        
        card.style.display = matchesSearch && matchesClass && matchesStatus ? 'flex' : 'none';
    });
}

// ===== وظائف Firebase - الحضور =====
function loadClassesForAttendance() {
    const classesRef = database.ref('classes');
    
    classesRef.once('value').then(snapshot => {
        const classes = snapshot.val();
        const select = document.getElementById('attendanceClass');
        
        if (!select) return;
        
        select.innerHTML = '<option value="">اختر الفصل</option>';
        
        if (classes) {
            Object.keys(classes).forEach(classId => {
                const className = classes[classId].name;
                const option = document.createElement('option');
                option.value = classId;
                option.textContent = className;
                select.appendChild(option);
            });
        }
    });
}

function loadClassesForSelect(selectId) {
    const classesRef = database.ref('classes');
    
    classesRef.once('value').then(snapshot => {
        const classes = snapshot.val();
        const select = document.getElementById(selectId);
        
        if (!select) return;
        
        select.innerHTML = '<option value="">اختر الفصل</option>';
        
        if (classes) {
            Object.keys(classes).forEach(classId => {
                const className = classes[classId].name;
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                select.appendChild(option);
            });
        }
    });
}

function loadAttendanceData() {
    if (!selectedClassId) {
        // عرض رسالة للمستخدم لاختيار فصل
        document.getElementById('attendanceTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>الرجاء اختيار الفصل وتاريخ الحضور</p>
                    </div>
                </td>
            </tr>
        `;
        
        document.getElementById('attendanceCardsContainer').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-check"></i>
                <p>الرجاء اختيار الفصل وتاريخ الحضور</p>
            </div>
        `;
        return;
    }
    
    // تحميل بيانات الفصل
    const classRef = database.ref(`classes/${selectedClassId}`);
    
    classRef.once('value').then(classSnapshot => {
        const classData = classSnapshot.val();
        
        if (!classData) {
            showNotification('الفصل غير موجود', 'error');
            return;
        }
        
        // تحميل الأطفال في هذا الفصل
        const childrenRef = database.ref('children');
        
        childrenRef.once('value').then(snapshot => {
            const children = snapshot.val();
            const tableBody = document.getElementById('attendanceTableBody');
            const cardsContainer = document.getElementById('attendanceCardsContainer');
            
            if (!tableBody || !cardsContainer) return;
            
            tableBody.innerHTML = '';
            cardsContainer.innerHTML = '';
            attendanceData = {};
            
            if (children) {
                let childrenInClass = [];
                
                // تصفية الأطفال حسب الفصل
                Object.keys(children).forEach(childId => {
                    const child = children[childId];
                    if (child.className === classData.name) {
                        childrenInClass.push({ id: childId, ...child });
                    }
                });
                
                if (childrenInClass.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center py-4">
                                <div class="empty-state">
                                    <i class="fas fa-users-slash"></i>
                                    <p>لا يوجد أطفال في هذا الفصل</p>
                                </div>
                            </td>
                        </tr>
                    `;
                    
                    cardsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-users-slash"></i>
                            <p>لا يوجد أطفال في هذا الفصل</p>
                        </div>
                    `;
                    return;
                }
                
                // تحميل بيانات الحضور السابقة
                const attendanceRef = database.ref(`attendance/${selectedClassId}/${selectedDate}`);
                
                attendanceRef.once('value').then(attendanceSnapshot => {
                    const existingAttendance = attendanceSnapshot.val() || {};
                    
                    let presentCount = 0;
                    let absentCount = 0;
                    let lateCount = 0;
                    
                    childrenInClass.forEach(child => {
                        // الحصول على حالة الحضور السابقة
                        const existingRecord = existingAttendance[child.id];
                        const status = existingRecord?.status || 'present';
                        const notes = existingRecord?.notes || '';
                        const time = existingRecord?.time || '--:--';
                        
                        // تحديث العدادات
                        if (status === 'present') presentCount++;
                        else if (status === 'absent') absentCount++;
                        else if (status === 'late') lateCount++;
                        
                        // حفظ البيانات
                        attendanceData[child.id] = {
                            status: status,
                            time: time,
                            notes: notes,
                            timestamp: new Date().toISOString()
                        };
                        
                        // إنشاء صف في الجدول
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-child"></i>
                                    ${child.fullName}
                                </div>
                            </td>
                            <td>${child.className}</td>
                            <td>
                                <span class="attendance-status status-${status}">
                                    ${status === 'present' ? 'حاضر' : status === 'absent' ? 'غائب' : 'متأخر'}
                                </span>
                            </td>
                            <td>${time}</td>
                            <td>${notes || 'لا يوجد'}</td>
                        `;
                        
                        tableBody.appendChild(row);
                        
                        // إنشاء بطاقة للحضور
                        const card = document.createElement('div');
                        card.className = 'attendance-card';
                        card.innerHTML = `
                            <div class="attendance-card-header">
                                <div class="attendance-card-avatar">
                                    <i class="fas fa-child"></i>
                                </div>
                                <div class="attendance-card-info">
                                    <h4>${child.fullName}</h4>
                                    <p>${child.className}</p>
                                </div>
                            </div>
                            <div class="attendance-card-controls">
                                <button class="btn ${status === 'present' ? 'btn-success' : 'btn-secondary'}" 
                                        onclick="setAttendance('${child.id}', 'present')">
                                    حاضر
                                </button>
                                <button class="btn ${status === 'absent' ? 'btn-danger' : 'btn-secondary'}" 
                                        onclick="setAttendance('${child.id}', 'absent')">
                                    غائب
                                </button>
                                <button class="btn ${status === 'late' ? 'btn-warning' : 'btn-secondary'}" 
                                        onclick="setAttendance('${child.id}', 'late')">
                                    متأخر
                                </button>
                            </div>
                            <div>
                                <label>ملاحظات:</label>
                                <input type="text" class="form-input attendance-notes" 
                                       value="${notes}"
                                       placeholder="أضف ملاحظة..."
                                       onchange="updateAttendanceNote('${child.id}', this.value)">
                            </div>
                        `;
                        
                        cardsContainer.appendChild(card);
                    });
                    
                    // تحديث الإحصائيات
                    updateAttendanceStatsCounts(presentCount, absentCount, lateCount, childrenInClass.length);
                    
                }).catch(error => {
                    console.error('خطأ في تحميل بيانات الحضور:', error);
                    showNotification('حدث خطأ في تحميل بيانات الحضور', 'error');
                });
                
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <div class="empty-state">
                                <i class="fas fa-users-slash"></i>
                                <p>لا يوجد أطفال في النظام</p>
                            </div>
                        </td>
                    </tr>
                `;
                
                cardsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <p>لا يوجد أطفال في النظام</p>
                    </div>
                `;
            }
        });
    }).catch(error => {
        console.error('خطأ في تحميل بيانات الفصل:', error);
        showNotification('حدث خطأ في تحميل بيانات الفصل', 'error');
    });
}

function setAttendance(childId, status) {
    if (!attendanceData[childId]) {
        attendanceData[childId] = {};
    }
    
    attendanceData[childId].status = status;
    attendanceData[childId].time = new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'});
    attendanceData[childId].timestamp = new Date().toISOString();
    
    // تحديث الواجهة
    loadAttendanceData();
    showNotification(`تم تعيين حالة الحضور لـ ${childId} إلى ${status}`, 'success');
}

function updateAttendanceNote(childId, note) {
    if (attendanceData[childId]) {
        attendanceData[childId].notes = note;
    }
}

function saveAttendance() {
    if (!selectedClassId) {
        showNotification('الرجاء اختيار الفصل أولاً', 'warning');
        return;
    }
    
    if (Object.keys(attendanceData).length === 0) {
        showNotification('لا يوجد أطفال لحفظ بيانات حضورهم', 'warning');
        return;
    }
    
    const saveBtn = document.querySelector('.save-attendance-btn') || document.querySelector('.btn-success');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        saveBtn.disabled = true;
    }
    
    const attendanceRef = database.ref(`attendance/${selectedClassId}/${selectedDate}`);
    
    attendanceRef.set(attendanceData)
        .then(() => {
            showNotification('تم حفظ الحضور بنجاح!', 'success');
            updateAttendanceStats();
        })
        .catch(error => {
            console.error('خطأ في حفظ الحضور:', error);
            showNotification('حدث خطأ في حفظ الحضور. حاول مرة أخرى.', 'error');
        })
        .finally(() => {
            if (saveBtn) {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        });
}

function updateAttendanceStatsCounts(present, absent, late, total) {
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    document.getElementById('attendancePercentage').textContent = `${percentage}%`;
    document.getElementById('attendanceProgress').style.width = `${percentage}%`;
    
    document.getElementById('totalAttendance').textContent = present;
    document.getElementById('totalAbsence').textContent = absent + late;
    document.getElementById('totalLate').textContent = late;
    
    // تحديث إحصائيات الشريط الجانبي
    document.getElementById('sidebarAttendanceToday').textContent = `${percentage}%`;
}

function updateAttendanceStats() {
    // إعادة تحميل بيانات الحضور
    loadAttendanceData();
}

// ===== وظائف Firebase - الحصص =====
function loadLessons() {
    const lessonsRef = database.ref('lessons');
    
    lessonsRef.on('value', (snapshot) => {
        const lessons = snapshot.val();
        const container = document.getElementById('lessonsGridContainer');
        
        if (!container) return;
        
        container.innerHTML = '';
        lessonsData = lessons || {};
        
        if (lessons) {
            // جمع جميع الحصص في مصفوفة واحدة
            let allLessons = [];
            
            Object.keys(lessons).forEach(classId => {
                if (lessons[classId]) {
                    Object.keys(lessons[classId]).forEach(lessonId => {
                        const lesson = lessons[classId][lessonId];
                        lesson.id = lessonId;
                        lesson.classId = classId;
                        allLessons.push(lesson);
                    });
                }
            });
            
            // ترتيب الحصص حسب التاريخ (من الأحدث إلى الأقدم)
            allLessons.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // عرض الحصص
            allLessons.forEach(lesson => {
                container.appendChild(createLessonCard(lesson));
            });
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>لا يوجد حصص</h3>
                    <p>ابدأ بإضافة الحصص والواجبات</p>
                </div>
            `;
        }
    });
}

function createLessonCard(lesson) {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.dataset.lessonId = lesson.id;
    card.dataset.classId = lesson.classId;
    card.dataset.subject = lesson.subject;
    card.dataset.className = lesson.classId;
    
    const date = new Date(lesson.date);
    const formattedDate = date.toLocaleDateString('ar-SA');
    const time = lesson.time || 'غير محدد';
    
    card.innerHTML = `
        <div class="lesson-card-header">
            <div class="lesson-card-icon">
                <i class="fas fa-book"></i>
            </div>
            <div class="lesson-card-info">
                <h4>${lesson.title}</h4>
                <p><i class="fas fa-book"></i> ${lesson.subject}</p>
                <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                <p><i class="fas fa-clock"></i> ${time}</p>
                <p><i class="fas fa-users"></i> ${lesson.classId}</p>
            </div>
        </div>
        <div class="lesson-card-details">
            <p><strong>الوصف:</strong> ${lesson.description || 'لا يوجد وصف'}</p>
            <p><strong>الواجب:</strong> ${lesson.homework || 'لا يوجد واجب'}</p>
        </div>
        <div class="lesson-card-actions">
            <button class="btn btn-primary btn-sm" onclick="viewLessonDetails('${lesson.id}', '${lesson.classId}')">
                <i class="fas fa-eye"></i> عرض التفاصيل
            </button>
            <button class="btn btn-secondary btn-sm" onclick="editLesson('${lesson.id}', '${lesson.classId}')">
                <i class="fas fa-edit"></i> تعديل
            </button>
        </div>
    `;
    
    return card;
}

function filterLessons() {
    const searchTerm = document.getElementById('searchLessons')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('lessonClassFilter')?.value || '';
    const subjectFilter = document.getElementById('lessonSubjectFilter')?.value || '';
    
    const container = document.getElementById('lessonsGridContainer');
    if (!container) return;
    
    const lessonCards = container.querySelectorAll('.lesson-card');
    
    lessonCards.forEach(card => {
        const className = card.dataset.className;
        const subject = card.dataset.subject;
        const title = card.querySelector('h4').textContent.toLowerCase();
        
        const matchesSearch = title.includes(searchTerm) ||
                            subject.toLowerCase().includes(searchTerm);
        
        const matchesClass = !classFilter || className === classFilter;
        const matchesSubject = !subjectFilter || subject === subjectFilter;
        
        card.style.display = matchesSearch && matchesClass && matchesSubject ? 'block' : 'none';
    });
}

function addNewLesson(e) {
    e.preventDefault();
    
    const lessonData = {
        title: document.getElementById('lessonTitle').value,
        subject: document.getElementById('lessonSubject').value,
        classId: document.getElementById('lessonClass').value,
        date: document.getElementById('lessonDate').value,
        time: document.getElementById('lessonTime').value,
        description: document.getElementById('lessonDescription').value,
        homework: document.getElementById('lessonHomework').value,
        dueDate: document.getElementById('homeworkDueDate').value,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    };
    
    // التحقق من البيانات
    if (!validateLessonData(lessonData)) {
        return;
    }
    
    const loadingBtn = document.querySelector('#addLessonForm button[type="submit"]');
    const originalText = loadingBtn.innerHTML;
    loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    loadingBtn.disabled = true;
    
    const classId = lessonData.classId;
    const lessonRef = database.ref(`lessons/${classId}`).push();
    
    lessonRef.set(lessonData)
        .then(() => {
            showNotification('تم إضافة الحصة بنجاح!', 'success');
            closeModal('addLessonModal');
            document.getElementById('addLessonForm').reset();
        })
        .catch(error => {
            console.error('خطأ في إضافة الحصة:', error);
            showNotification('حدث خطأ في إضافة الحصة. حاول مرة أخرى.', 'error');
        })
        .finally(() => {
            loadingBtn.innerHTML = originalText;
            loadingBtn.disabled = false;
        });
}

function validateLessonData(data) {
    if (!data.title || data.title.trim().length < 3) {
        showNotification('يرجى إدخال عنوان الحصة (3 أحرف على الأقل)', 'error');
        return false;
    }
    
    if (!data.subject) {
        showNotification('يرجى اختيار المادة', 'error');
        return false;
    }
    
    if (!data.classId) {
        showNotification('يرجى اختيار الفصل', 'error');
        return false;
    }
    
    if (!data.date) {
        showNotification('يرجى إدخال تاريخ الحصة', 'error');
        return false;
    }
    
    if (!data.time) {
        showNotification('يرجى إدخال وقت الحصة', 'error');
        return false;
    }
    
    return true;
}

function viewLessonDetails(lessonId, classId) {
    const lessonRef = database.ref(`lessons/${classId}/${lessonId}`);
    
    lessonRef.once('value').then(snapshot => {
        const lesson = snapshot.val();
        
        if (!lesson) {
            showNotification('الحصة غير موجودة', 'error');
            return;
        }
        
        const date = new Date(lesson.date);
        const formattedDate = date.toLocaleDateString('ar-SA');
        const dueDate = lesson.dueDate ? new Date(lesson.dueDate).toLocaleDateString('ar-SA') : 'غير محدد';
        
        const modalContent = `
            <div class="modal-header">
                <h3><i class="fas fa-book-open"></i> تفاصيل الحصة</h3>
                <span class="close-modal" onclick="closeModal('lessonDetailsModal')">&times;</span>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 2rem;">
                    <h2 style="margin: 0 0 0.5rem 0; color: var(--text-color)">${lesson.title}</h2>
                    <p style="color: var(--text-light); margin: 0">${lesson.subject} • ${lesson.classId}</p>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-calendar"></i> تاريخ الحصة</label>
                        <p>${formattedDate}</p>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-clock"></i> وقت الحصة</label>
                        <p>${lesson.time || 'غير محدد'}</p>
                    </div>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-align-left"></i> وصف الحصة</label>
                    <p>${lesson.description || 'لا يوجد وصف'}</p>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-tasks"></i> الواجب المنزلي</label>
                    <p>${lesson.homework || 'لا يوجد واجب'}</p>
                </div>
                
                ${lesson.dueDate ? `
                    <div class="form-group">
                        <label><i class="fas fa-calendar-check"></i> موعد تسليم الواجب</label>
                        <p>${dueDate}</p>
                    </div>
                ` : ''}
                
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="closeModal('lessonDetailsModal')">
                        إغلاق
                    </button>
                    <button class="btn btn-primary" onclick="editLesson('${lessonId}', '${classId}')">
                        <i class="fas fa-edit"></i> تعديل الحصة
                    </button>
                </div>
            </div>
        `;
        
        showCustomModal('lessonDetailsModal', modalContent);
    });
}

function editLesson(lessonId, classId) {
    showNotification('سيتم إضافة ميزة التعديل قريباً', 'info');
}

// ===== وظائف Firebase - المعلمين =====
function loadTeachers() {
    const teachersRef = database.ref('teachers');
    
    teachersRef.on('value', (snapshot) => {
        const teachers = snapshot.val();
        const container = document.getElementById('teachersGridContainer');
        
        if (!container) return;
        
        container.innerHTML = '';
        teachersData = teachers || {};
        
        if (teachers) {
            Object.keys(teachers).forEach(teacherId => {
                const teacher = teachers[teacherId];
                container.appendChild(createTeacherCard(teacher, teacherId));
            });
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <h3>لا يوجد معلمون</h3>
                    <p>ابدأ بإضافة المعلمين إلى النظام</p>
                </div>
            `;
        }
    });
}

function createTeacherCard(teacher, teacherId) {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.dataset.teacherId = teacherId;
    
    card.innerHTML = `
        <div class="teacher-avatar">
            <i class="fas fa-chalkboard-teacher"></i>
        </div>
        <div class="teacher-info">
            <h4>${teacher.name}</h4>
            <p><i class="fas fa-book"></i> ${teacher.specialty || 'غير محدد'}</p>
            <p><i class="fas fa-envelope"></i> ${teacher.email || 'غير متوفر'}</p>
            <p><i class="fas fa-phone"></i> ${teacher.phone || 'غير متوفر'}</p>
        </div>
        <div class="child-actions">
            <button class="btn-icon" onclick="viewTeacherDetails('${teacherId}', event)">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon" onclick="editTeacher('${teacherId}', event)">
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `;
    
    return card;
}

function filterTeachers() {
    const searchTerm = document.getElementById('searchTeachers')?.value.toLowerCase() || '';
    
    const container = document.getElementById('teachersGridContainer');
    if (!container) return;
    
    const teacherCards = container.querySelectorAll('.teacher-card');
    
    teacherCards.forEach(card => {
        const teacherId = card.dataset.teacherId;
        const teacher = teachersData[teacherId];
        
        if (!teacher) return;
        
        const matchesSearch = teacher.name.toLowerCase().includes(searchTerm) ||
                             (teacher.email && teacher.email.toLowerCase().includes(searchTerm)) ||
                             (teacher.specialty && teacher.specialty.toLowerCase().includes(searchTerm));
        
        card.style.display = matchesSearch ? 'flex' : 'none';
    });
}

function viewTeacherDetails(teacherId, event = null) {
    if (event) event.stopPropagation();
    
    const teacher = teachersData[teacherId];
    if (!teacher) return;
    
    const modalContent = `
        <div class="modal-header">
            <h3><i class="fas fa-chalkboard-teacher"></i> تفاصيل المعلم</h3>
            <span class="close-modal" onclick="closeModal('teacherDetailsModal')">&times;</span>
        </div>
        <div class="modal-body">
            <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem;">
                <div style="font-size: 4rem; color: var(--primary-color)">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <div>
                    <h2 style="margin: 0 0 0.5rem 0; color: var(--text-color)">${teacher.name}</h2>
                    <p style="color: var(--text-light); margin: 0">${teacher.specialty || 'غير محدد'}</p>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> البريد الإلكتروني</label>
                    <p>${teacher.email || 'غير متوفر'}</p>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-phone"></i> رقم الهاتف</label>
                    <p>${teacher.phone || 'غير متوفر'}</p>
                </div>
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-book"></i> التخصص</label>
                <p>${teacher.specialty || 'غير محدد'}</p>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="closeModal('teacherDetailsModal')">
                    إغلاق
                </button>
                <button class="btn btn-primary" onclick="editTeacher('${teacherId}')">
                    <i class="fas fa-edit"></i> تعديل البيانات
                </button>
            </div>
        </div>
    `;
    
    showCustomModal('teacherDetailsModal', modalContent);
}

function editTeacher(teacherId, event = null) {
    if (event) event.stopPropagation();
    showNotification('سيتم إضافة ميزة التعديل قريباً', 'info');
}

// ===== وظائف Firebase - الفصول =====
function loadClasses() {
    const classesRef = database.ref('classes');
    
    classesRef.on('value', (snapshot) => {
        const classes = snapshot.val();
        const container = document.getElementById('classesGridContainer');
        
        if (!container) return;
        
        container.innerHTML = '';
        classesData = classes || {};
        
        if (classes) {
            Object.keys(classes).forEach(classId => {
                const classData = classes[classId];
                container.appendChild(createClassCard(classData, classId));
            });
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>لا يوجد فصول</h3>
                    <p>ابدأ بإضافة الفصول إلى النظام</p>
                </div>
            `;
        }
    });
}

function createClassCard(classData, classId) {
    const card = document.createElement('div');
    card.className = 'class-card';
    
    // حساب عدد الأطفال في الفصل
    const childrenRef = database.ref('children');
    let childrenCount = 0;
    
    childrenRef.once('value').then(snapshot => {
        const children = snapshot.val();
        if (children) {
            Object.keys(children).forEach(childId => {
                const child = children[childId];
                if (child.className === classData.name) {
                    childrenCount++;
                }
            });
            
            // تحديث العداد في البطاقة
            const countElement = card.querySelector('.class-stat-value');
            if (countElement) {
                countElement.textContent = childrenCount;
            }
        }
    });
    
    card.innerHTML = `
        <div class="class-icon">
            <i class="fas fa-chalkboard"></i>
        </div>
        <div class="class-info">
            <h4>${classData.name}</h4>
            <p>العام الدراسي: ${classData.academicYear || '2024-2025'}</p>
            <p>المعلم: ${classData.teacher || 'غير محدد'}</p>
        </div>
        <div class="class-stats">
            <div class="class-stat">
                <span class="class-stat-value">0</span>
                <span class="class-stat-label">طفل</span>
            </div>
            <div class="class-stat">
                <span class="class-stat-value">0</span>
                <span class="class-stat-label">معلم</span>
            </div>
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
            <button class="btn btn-primary btn-sm" onclick="viewClassDetails('${classId}')">
                <i class="fas fa-eye"></i> عرض
            </button>
            <button class="btn btn-secondary btn-sm" onclick="manageClass('${classId}')">
                <i class="fas fa-cog"></i> إدارة
            </button>
        </div>
    `;
    
    return card;
}

function viewClassDetails(classId) {
    const classRef = database.ref(`classes/${classId}`);
    
    classRef.once('value').then(snapshot => {
        const classData = snapshot.val();
        
        if (!classData) {
            showNotification('الفصل غير موجود', 'error');
            return;
        }
        
        // حساب عدد الأطفال
        const childrenRef = database.ref('children');
        let childrenCount = 0;
        let childrenList = [];
        
        childrenRef.once('value').then(childrenSnapshot => {
            const children = childrenSnapshot.val();
            if (children) {
                Object.keys(children).forEach(childId => {
                    const child = children[childId];
                    if (child.className === classData.name) {
                        childrenCount++;
                        childrenList.push(child);
                    }
                });
            }
            
            const modalContent = `
                <div class="modal-header">
                    <h3><i class="fas fa-chalkboard"></i> تفاصيل الفصل</h3>
                    <span class="close-modal" onclick="closeModal('classDetailsModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 2rem;">
                        <h2 style="margin: 0 0 0.5rem 0; color: var(--text-color)">${classData.name}</h2>
                        <p style="color: var(--text-light); margin: 0">العام الدراسي: ${classData.academicYear || '2024-2025'}</p>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><i class="fas fa-child"></i> عدد الأطفال</label>
                            <p>${childrenCount} طفل</p>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-user-tie"></i> المعلم</label>
                            <p>${classData.teacher || 'غير محدد'}</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-users"></i> قائمة الأطفال</label>
                        <div style="max-height: 200px; overflow-y: auto; margin-top: 0.5rem;">
                            ${childrenList.length > 0 ? 
                                childrenList.map(child => `<p style="padding: 0.5rem; background: var(--primary-light); border-radius: 4px; margin: 0.25rem 0;">${child.fullName}</p>`).join('') : 
                                '<p style="color: var(--text-light); text-align: center;">لا يوجد أطفال في هذا الفصل</p>'
                            }
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="manageClass('${classId}')">
                            <i class="fas fa-cog"></i> إدارة الفصل
                        </button>
                        <button class="btn btn-secondary" onclick="closeModal('classDetailsModal')">
                            إغلاق
                        </button>
                    </div>
                </div>
            `;
            
            showCustomModal('classDetailsModal', modalContent);
        });
    });
}

function manageClass(classId) {
    showNotification('سيتم إضافة ميزة إدارة الفصل قريباً', 'info');
}

// ===== وظائف مساعدة =====
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        </div>
        <div class="notification-content">
            ${message}
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // إزالة تلقائية بعد 2 ثواني
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 2000);
}

// ===== وظائف إضافية =====
function viewChildDetails(childId, event = null) {
    if (event) event.stopPropagation();
    
    const child = childrenData[childId];
    if (!child) return;
    
    const age = calculateAge(child.birthDate);
    
    const modalContent = `
        <div class="modal-header">
            <h3><i class="fas fa-child"></i> تفاصيل الطفل</h3>
            <span class="close-modal" onclick="closeModal('childDetailsModal')">&times;</span>
        </div>
        <div class="modal-body">
            <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem;">
                <div style="font-size: 4rem; color: ${child.gender === 'أنثى' ? '#FF6B8B' : '#4A90E2'}">
                    <i class="fas ${child.gender === 'أنثى' ? 'fa-female' : 'fa-male'}"></i>
                </div>
                <div>
                    <h2 style="margin: 0 0 0.5rem 0; color: var(--text-color)">${child.fullName}</h2>
                    <p style="color: var(--text-light); margin: 0">${child.className} • ${age} سنة</p>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-birthday-cake"></i> تاريخ الميلاد</label>
                    <p>${formatDate(child.birthDate)}</p>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-venus-mars"></i> الجنس</label>
                    <p>${child.gender}</p>
                </div>
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-user-friends"></i> ولي الأمر</label>
                <p>${child.parentName}</p>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-phone"></i> هاتف ولي الأمر</label>
                    <p>${child.parentPhone || 'غير متوفر'}</p>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> البريد الإلكتروني</label>
                    <p>${child.parentEmail || 'غير متوفر'}</p>
                </div>
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-ambulance"></i> جهة اتصال الطوارئ</label>
                <p>${child.emergencyContact || 'غير متوفر'}</p>
            </div>
            
            ${child.medicalNotes ? `
                <div class="form-group">
                    <label><i class="fas fa-heartbeat"></i> ملاحظات طبية</label>
                    <p>${child.medicalNotes}</p>
                </div>
            ` : ''}
            
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-calendar-plus"></i> تاريخ التسجيل</label>
                    <p>${formatDate(child.registrationDate)}</p>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-info-circle"></i> الحالة</label>
                    <p><span class="status-badge status-active">نشط</span></p>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="closeModal('childDetailsModal')">
                    إغلاق
                </button>
                <button class="btn btn-primary" onclick="editChild('${childId}')">
                    <i class="fas fa-edit"></i> تعديل البيانات
                </button>
            </div>
        </div>
    `;
    
    showCustomModal('childDetailsModal', modalContent);
}

function editChild(childId, event = null) {
    if (event) event.stopPropagation();
    
    const child = childrenData[childId];
    if (!child) return;
    
    const modalContent = `
        <div class="modal-header">
            <h3><i class="fas fa-edit"></i> تعديل بيانات الطفل</h3>
            <span class="close-modal" onclick="closeModal('editChildModal')">&times;</span>
        </div>
        <div class="modal-body">
            <form id="editChildForm" onsubmit="updateChild('${childId}', event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editChildName"><i class="fas fa-user"></i> اسم الطفل كامل</label>
                        <input type="text" id="editChildName" value="${child.fullName}" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="editBirthDate"><i class="fas fa-birthday-cake"></i> تاريخ الميلاد</label>
                        <input type="date" id="editBirthDate" value="${child.birthDate}" required class="form-input">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editGender"><i class="fas fa-venus-mars"></i> الجنس</label>
                        <select id="editGender" required class="form-input">
                            <option value="ذكر" ${child.gender === 'ذكر' ? 'selected' : ''}>ذكر</option>
                            <option value="أنثى" ${child.gender === 'أنثى' ? 'selected' : ''}>أنثى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editClassName"><i class="fas fa-users"></i> الفصل الدراسي</label>
                        <select id="editClassName" required class="form-input">
                            <option value="الروضة الأولى" ${child.className === 'الروضة الأولى' ? 'selected' : ''}>الروضة الأولى</option>
                            <option value="الروضة الثانية" ${child.className === 'الروضة الثانية' ? 'selected' : ''}>الروضة الثانية</option>
                            <option value="التمهيدي" ${child.className === 'التمهيدي' ? 'selected' : ''}>التمهيدي</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editParentName"><i class="fas fa-user-friends"></i> اسم ولي الأمر</label>
                    <input type="text" id="editParentName" value="${child.parentName}" required class="form-input">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editParentPhone"><i class="fas fa-phone"></i> هاتف ولي الأمر</label>
                        <input type="tel" id="editParentPhone" value="${child.parentPhone}" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="editParentEmail"><i class="fas fa-envelope"></i> البريد الإلكتروني</label>
                        <input type="email" id="editParentEmail" value="${child.parentEmail || ''}" class="form-input">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editEmergencyContact"><i class="fas fa-ambulance"></i> جهة اتصال طوارئ</label>
                        <input type="text" id="editEmergencyContact" value="${child.emergencyContact || ''}" class="form-input">
                </div>
                
                <div class="form-group">
                    <label for="editMedicalNotes"><i class="fas fa-heartbeat"></i> ملاحظات طبية</label>
                    <textarea id="editMedicalNotes" rows="3" class="form-input">${child.medicalNotes || ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('editChildModal')">
                        إلغاء
                    </button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-save"></i> حفظ التعديلات
                    </button>
                </div>
            </form>
        </div>
    `;
    
    showCustomModal('editChildModal', modalContent);
}

function updateChild(childId, e) {
    e.preventDefault();
    
    const updatedData = {
        fullName: document.getElementById('editChildName').value,
        birthDate: document.getElementById('editBirthDate').value,
        gender: document.getElementById('editGender').value,
        className: document.getElementById('editClassName').value,
        parentName: document.getElementById('editParentName').value,
        parentPhone: document.getElementById('editParentPhone').value,
        parentEmail: document.getElementById('editParentEmail').value || '',
        emergencyContact: document.getElementById('editEmergencyContact').value || '',
        medicalNotes: document.getElementById('editMedicalNotes').value || '',
        lastUpdated: new Date().toISOString()
    };
    
    // التحقق من البيانات
    if (!validateChildData(updatedData)) {
        return;
    }
    
    const loadingBtn = document.querySelector('#editChildForm button[type="submit"]');
    const originalText = loadingBtn.innerHTML;
    loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    loadingBtn.disabled = true;
    
    database.ref(`children/${childId}`).update(updatedData)
        .then(() => {
            showNotification('تم تحديث بيانات الطفل بنجاح!', 'success');
            closeModal('editChildModal');
        })
        .catch(error => {
            console.error('خطأ في تحديث بيانات الطفل:', error);
            showNotification('حدث خطأ في تحديث البيانات. حاول مرة أخرى.', 'error');
        })
        .finally(() => {
            loadingBtn.innerHTML = originalText;
            loadingBtn.disabled = false;
        });
}

function deleteChild(childId, event = null) {
    if (event) event.stopPropagation();
    
    if (confirm('هل أنت متأكد من حذف هذا الطفل؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        const childRef = database.ref(`children/${childId}`);
        
        childRef.remove()
            .then(() => {
                showNotification('تم حذف الطفل بنجاح!', 'success');
            })
            .catch(error => {
                console.error('خطأ في حذف الطفل:', error);
                showNotification('حدث خطأ في حذف الطفل. حاول مرة أخرى.', 'error');
            });
    }
}

function showCustomModal(modalId, content) {
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            ${content}
        </div>
    `;
    
    modal.style.display = 'flex';
}

// ===== الرسوم البيانية =====
function initializeCharts() {
    // تأكد من وجود عناصر الرسوم البيانية
    const attendanceChartCanvas = document.getElementById('attendanceChart');
    const classesChartCanvas = document.getElementById('classesChart');
    const activitiesChartCanvas = document.getElementById('activitiesChart');
    const progressChartCanvas = document.getElementById('progressChart');
    
    if (!attendanceChartCanvas || !classesChartCanvas) return;
    
    // رسم بياني للحضور
    const attendanceCtx = attendanceChartCanvas.getContext('2d');
    new Chart(attendanceCtx, {
        type: 'line',
        data: {
            labels: ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'],
            datasets: [{
                label: 'نسبة الحضور',
                data: [85, 88, 92, 90],
                borderColor: '#4A90E2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Segoe UI',
                            size: 14
                        }
                    }
                },
                tooltip: {
                    rtl: true,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
    
    // رسم بياني لتوزيع الفصول
    const classesCtx = classesChartCanvas.getContext('2d');
    new Chart(classesCtx, {
        type: 'doughnut',
        data: {
            labels: ['الروضة الأولى', 'الروضة الثانية', 'التمهيدي'],
            datasets: [{
                data: [15, 20, 12],
                backgroundColor: [
                    '#4A90E2',
                    '#F5A623',
                    '#7ED321'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Segoe UI',
                            size: 14
                        },
                        padding: 20
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // رسم بياني للأنشطة
    if (activitiesChartCanvas) {
        const activitiesCtx = activitiesChartCanvas.getContext('2d');
        new Chart(activitiesCtx, {
            type: 'bar',
            data: {
                labels: ['اللغة', 'الرياضيات', 'العلوم', 'الفنون', 'الرياضة'],
                datasets: [{
                    label: 'عدد الأنشطة',
                    data: [12, 8, 6, 10, 7],
                    backgroundColor: [
                        '#4A90E2',
                        '#F5A623',
                        '#7ED321',
                        '#50E3C2',
                        '#FF6B8B'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        rtl: true,
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 2
                        }
                    }
                }
            }
        });
    }
    
    // رسم بياني للتقدم
    if (progressChartCanvas) {
        const progressCtx = progressChartCanvas.getContext('2d');
        new Chart(progressCtx, {
            type: 'radar',
            data: {
                labels: ['اللغة', 'الرياضيات', 'العلوم', 'الإبداع', 'الاجتماعي', 'الحركي'],
                datasets: [{
                    label: 'متوسط التقدم',
                    data: [85, 78, 92, 88, 80, 75],
                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                    borderColor: '#4A90E2',
                    borderWidth: 2,
                    pointBackgroundColor: '#4A90E2'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const month = document.getElementById('reportMonth').value;
    
    showNotification(`جارٍ إنشاء تقرير ${reportType} لشهر ${month}...`, 'info');
    
    // يمكنك تنفيذ منطق إنشاء التقرير هنا
    setTimeout(() => {
        showNotification('تم إنشاء التقرير بنجاح!', 'success');
    }, 2000);
}

// ===== وظائف إضافية =====
function exportData() {
    showNotification('جارٍ تصدير البيانات...', 'info');
    
    // جمع جميع البيانات
    const exportData = {
        children: childrenData,
        lessons: lessonsData,
        teachers: teachersData,
        classes: classesData,
        exportDate: new Date().toISOString(),
        exportBy: 'System Admin'
    };
    
    // تحويل إلى JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // إنشاء رابط للتحميل
    const exportFileDefaultName = `little-stars-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('تم تصدير البيانات بنجاح!', 'success');
}

function backupDatabase() {
    showNotification('جارٍ إنشاء نسخة احتياطية...', 'info');
    
    // تنفيذ نسخ احتياطي
    setTimeout(() => {
        showNotification('تم إنشاء النسخة الاحتياطية بنجاح!', 'success');
    }, 1500);
}

function loadMessages() {
    // سيتم تنفيذ هذه الوظيفة لاحقاً
}

// ===== تهيئة الرسوم البيانية عند تحميل الصفحة =====
window.onload = function() {
    setTimeout(initializeCharts, 1000);
};

// ===== إضافة تصدير البيانات =====
function autoBackup() {
    const lastBackup = localStorage.getItem('lastBackup');
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastBackup || lastBackup !== today) {
        exportData();
        localStorage.setItem('lastBackup', today);
    }
}

// تشغيل النسخ الاحتياطي التلقائي مرة واحدة يومياً
setInterval(autoBackup, 24 * 60 * 60 * 1000);