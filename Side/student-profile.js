// إعداد اتصال Supabase
const SUPABASE_URL = "https://mtwwslednzzseoihsbrb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7kYHCVI_a9jNIOiKTEd-sQ_S9VMkWYg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const profileSearchInput = document.getElementById('profileSearchInput');
const btnSearchProfile = document.getElementById('btnSearchProfile');
const searchPlaceholder = document.getElementById('searchPlaceholder');
const profileContainer = document.getElementById('profileContainer');
const btnDeleteStudent = document.getElementById('btnDeleteStudent'); // زر الحذف الجديد

// الحقول الشخصية
const pStudentName = document.getElementById('pStudentName');
const pStudentId = document.getElementById('pStudentId');
const pAcademicYear = document.getElementById('pAcademicYear');
const pLoginCode = document.getElementById('pLoginCode');
const pPassword = document.getElementById('pPassword');
const pStudentPhone = document.getElementById('pStudentPhone');
const pParentPhone = document.getElementById('pParentPhone');

// الجداول والإحصائيات
const statPresent = document.getElementById('statPresent');
const statAbsent = document.getElementById('statAbsent');
const statRatio = document.getElementById('statRatio');
const statGrades = document.getElementById('statGrades');
const statPaymentStatus = document.getElementById('statPaymentStatus');
const pAttendanceTableBody = document.getElementById('pAttendanceTableBody');
const pGradesTableBody = document.getElementById('pGradesTableBody');
const pPaymentsTableBody = document.getElementById('pPaymentsTableBody');

const currentTeacherId = localStorage.getItem('teacher_id'); // جلب ID المدرس

// متغير لحفظ بيانات الطالب النشط حالياً لتسهيل حذفه
let currentActiveStudent = null;

btnSearchProfile.addEventListener('click', async () => {
    const searchVal = profileSearchInput.value.trim();
    if (!searchVal) { alert("⚠️ برجاء كتابة بيانات البحث أولاً."); return; }

    btnSearchProfile.innerHTML = `⏳ جاري التحميل...`;
    btnSearchProfile.disabled = true;

    // 1. استعلام البحث المرن
    let query = supabaseClient.from("students").select("*").eq('teacher_id', currentTeacherId);
    if (!isNaN(searchVal) && searchVal !== "") { query = query.eq("student_id", Number(searchVal)); }
    else if (searchVal.toUpperCase().startsWith("STD-")) { query = query.eq("login_code", searchVal.toUpperCase()); }
    else { query = query.ilike("student_name", `%${searchVal}%`); }

    const { data: studentData, error: studentError } = await query;

    if (studentError || !studentData || studentData.length === 0) {
        alert("❌ لم يتم العثور على الطالب.");
        resetProfileView();
        return;
    }

    const student = studentData[0];
    currentActiveStudent = student; // حفظ الطالب الحالي في الذاكرة

    pStudentId.textContent = student.student_id;
    pStudentName.textContent = student.student_name;
    pAcademicYear.textContent = student.academic_year;
    pLoginCode.textContent = student.login_code;
    pPassword.textContent = student.password;
    pStudentPhone.textContent = student.student_phone || "غير مسجل";
    pParentPhone.textContent = student.parent_phone || "غير مسجل";

    // 2. جلب سجل الحضور
    const { data: attData } = await supabaseClient.from('attendance').select('*').eq('student_id', student.student_id).eq('teacher_id', currentTeacherId).order('session_date', { ascending: false });
    let present = 0, absent = 0;
    pAttendanceTableBody.innerHTML = '';
    if (attData && attData.length > 0) {
        attData.forEach(row => {
            if (row.status === 'حاضر') present++; else absent++;
            pAttendanceTableBody.innerHTML += `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="p-2.5 font-mono">${row.session_date}</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded-md text-xs font-bold ${row.status === 'حاضر'?'text-emerald-600 bg-emerald-50':'text-red-600 bg-red-50'}">${row.status}</span></td>
                    <td class="p-2.5 text-slate-500">${row.late_minutes || 0} دقيقة</td>
                </tr>`;
        });
    } else { pAttendanceTableBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-400 italic">لا يوجد سجل حضور.</td></tr>`; }

    statPresent.textContent = `${present} أيام`;
    statAbsent.textContent = `${absent} أيام`;
    statRatio.textContent = `${(present + absent) > 0 ? Math.round((present / (present + absent)) * 100) : 0}%`;

    // 3. جلب سجل الدرجات
    const { data: gradesData } = await supabaseClient.from('exam_grades').select('student_score, teacher_notes, exams ( exam_name, max_score )').eq('student_id', student.student_id).eq('teacher_id', currentTeacherId);
    let earned = 0, max = 0;
    pGradesTableBody.innerHTML = '';
    if (gradesData && gradesData.length > 0) {
        gradesData.forEach(row => {
            if (row.exams) {
                earned += row.student_score || 0; max += row.exams.max_score || 0;
                pGradesTableBody.innerHTML += `
                    <tr class="border-b border-slate-100 hover:bg-slate-50">
                        <td class="p-2.5 font-bold">${row.exams.exam_name}</td>
                        <td class="p-2.5 text-indigo-600 font-bold">${row.student_score}</td>
                        <td class="p-2.5 text-slate-400 font-mono">${row.exams.max_score}</td>
                        <td class="p-2.5 text-xs text-slate-500 italic">${row.teacher_notes || 'لا يوجد'}</td>
                    </tr>`;
            }
        });
    } else { pGradesTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">لا توجد اختبارات.</td></tr>`; }
    statGrades.textContent = `${earned} / ${max}`;

    // 4. جلب سجل المدفوعات المالية
    const { data: payData, error: payError } = await supabaseClient.from('payments').select('*').eq('student_id', student.student_id).eq('teacher_id', currentTeacherId).order('payment_date', { ascending: false });
    pPaymentsTableBody.innerHTML = '';
    if (!payError && payData && payData.length > 0) {
        statPaymentStatus.textContent = payData[0].payment_status;
        statPaymentStatus.className = payData[0].payment_status === 'تم الدفع' ? "text-xl font-black text-emerald-600" : "text-xl font-black text-red-500";

        payData.forEach(row => {
            pPaymentsTableBody.innerHTML += `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="p-2.5 font-bold text-slate-800">${row.month_name}</td>
                    <td class="p-2.5 font-mono text-emerald-600 font-bold">${row.amount_paid} ج.م</td>
                    <td class="p-2.5 font-mono text-slate-500">${row.payment_date}</td>
                    <td class="p-2.5"><span class="px-2 py-0.5 rounded-md text-xs font-bold ${row.payment_status === 'تم الدفع'?'bg-emerald-50 text-emerald-600':'bg-red-50 text-red-600'}">${row.payment_status}</span></td>
                </tr>`;
        });
    } else {
        statPaymentStatus.textContent = "لم يدفع";
        statPaymentStatus.className = "text-xl font-black text-red-500";
        pPaymentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">لا توجد وصولات مادية مسجلة.</td></tr>`;
    }

    searchPlaceholder.classList.add('hidden');
    profileContainer.classList.remove('hidden');
    btnSearchProfile.innerHTML = `🔍 عرض الملف`;
    btnSearchProfile.disabled = false;
});

// دالة لتنظيف الواجهة عند الفشل أو بعد إتمام الحذف
function resetProfileView() {
    currentActiveStudent = null;
    profileSearchInput.value = '';
    btnSearchProfile.innerHTML = `🔍 عرض الملف`;
    btnSearchProfile.disabled = false;
    profileContainer.classList.add('hidden');
    searchPlaceholder.classList.remove('hidden');
}

// ============================================================
// 🔥 دالة الحذف النهائي الحساسة للمدرس مع تأكيد على الصفحة
// ============================================================
btnDeleteStudent.addEventListener('click', async () => {
    if (!currentActiveStudent) return;

    const studentId = currentActiveStudent.student_id;
    const studentName = currentActiveStudent.student_name;

    // التنبيه الأول للمدرس
    const firstConfirm = confirm(`⚠️ تنبيه المدرس!\nهل أنت متأكد من رغبتك في حذف الطالب:\n(${studentName}) نهائياً من قاعدة البيانات بالكامل؟`);
    if (!firstConfirm) return;

    // التنبيه الثاني والأخير لتوضيح التبعات
    const secondConfirm = confirm(`🚨 تحذير أخير وحاسم!\nهذا الإجراء سيقوم بمسح الطالب، ومسح كافة (سجلات الحضور، درجات الامتحانات، والوصولات المالية الصادرة له) فوراً ومن الجذور.\n\nهل أنت متأكد وتتحمل مسؤولية هذا القرار؟`);
    if (!secondConfirm) return;

    try {
        btnDeleteStudent.innerHTML = `⏳ جاري التدمير النهائي...`;
        btnDeleteStudent.disabled = true;

        // 1. تصفية وحذف سجلات الجداول الفرعية المعتمدة على الـ ID لتفادي الـ Constraint Error
        await supabaseClient.from('attendance').delete().eq('student_id', studentId);
        await supabaseClient.from('exam_grades').delete().eq('student_id', studentId);
        await supabaseClient.from('payments').delete().eq('student_id', studentId);

        // 2. حذف كارت الطالب الأساسي من جدول الطلاب
        const { error } = await supabaseClient
            .from('students')
            .delete()
            .eq('student_id', studentId);

        if (error) throw error;

        alert(`🎯 نجاح العمل! تم حذف الطالب (${studentName}) ومحو سجلاته بالكامل من نظام مجموعاتك.`);
        
        // 3. إخفاء الواجهة وإرجاع المدرس لوضع البحث الافتراضي
        resetProfileView();

    } catch (err) {
        console.error("Error destroying student records:", err);
        alert("❌ حدث خطأ غير متوقع أثناء الحذف. يرجى التأكد من صلاحيات الـ Admin في جدول السيرفر.");
        btnDeleteStudent.innerHTML = `<i class="fa-solid fa-trash-can"></i> حذف هذا الطالب نهائياً من السيستم`;
        btnDeleteStudent.disabled = false;
    }
});