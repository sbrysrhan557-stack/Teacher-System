// حفظ بيانات تسجيل الدخول في local Storage
// ===========================================
if (localStorage.getItem('is_teacher') !== 'true') {
    window.location.href = "../index.html";
}
const currentTeacherId = localStorage.getItem('teacher_id'); // جلب ID المدرس
// جلب اسم المدرس من localStorage
const teacherName = localStorage.getItem('teacher_name') || "مدرس";

// وضع الاسم في العنصر المخصص له في الـ HTML
const teacherNameDisplay = document.getElementById('teacherNameDisplay');
if (teacherNameDisplay) {
    teacherNameDisplay.textContent = teacherName;
}

// ===========================================
// 0. دالة جلب الطلاب (مربوطة بالمدرس الحالي فقط)
// ===========================================
async function loadMyStudents() {
    const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('teacher_id', currentTeacherId); // هنا الفلترة الأساسية

    if (error) {
        console.error("خطأ في جلب الطلاب:", error);
    } else {
        console.log("طلاب المدرس الحالي:", data);
        // قم بتحديث الجدول في الـ HTML هنا
    }
}

// ==========================================
// 1. إعداد الاتصال بـ Supabase والمتغيرات العامة
// ==========================================
const SUPABASE_URL = "https://mtwwslednzzseoihsbrb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7kYHCVI_a9jNIOiKTEd-sQ_S9VMkWYg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ==========================================
// 2. تعيين عناصر واجهة المستخدم (DOM Elements) مرة واحدة فقط منعاً للتكرار
// ==========================================
// إضافة طالب
const addStudentForm = document.getElementById("addStudentForm");

// الحضور والغياب الجماعي
const attendanceAcademicYear = document.getElementById('attendanceAcademicYear');
const bulkAttendanceTableBody = document.getElementById('bulkAttendanceTableBody');
const bulkAttendanceForm = document.getElementById('bulkAttendanceForm');
const btnSaveBulkAttendance = document.getElementById('btnSaveBulkAttendance');
const attendanceDateInput = document.getElementById('attendanceDate');

// رصد الدرجات الجماعي
const examAcademicYear = document.getElementById('examAcademicYear');
const bulkStudentsTableBody = document.getElementById('bulkStudentsTableBody');
const bulkGradesForm = document.getElementById('bulkGradesForm');
const btnSaveBulkGrades = document.getElementById('btnSaveBulkGrades');

// الفلترة والبحث
const filterAcademicYear = document.getElementById("filterAcademicYear");
const navSearchInput = document.getElementById("navSearchInput");
const reportTableBody = document.getElementById("reportTableBody");

// تعديل البيانات
const editSearchIdInput = document.getElementById("editSearchId");
const btnFetchStudent = document.getElementById("btnFetchStudent");
const editStudentForm = document.getElementById("editStudentForm");
const editStudentName = document.getElementById("editStudentName");
const editStudentPhone = document.getElementById("editStudentPhone");
const editParentPhone = document.getElementById("editParentPhone");
const editAcademicYear = document.getElementById("editAcademicYear");

let currentEditingStudentId = null; // لحفظ الـ ID الجاري تعديله

// تعيين تاريخ اليوم تلقائياً في خانة الغياب
if (attendanceDateInput) {
  attendanceDateInput.value = new Date().toISOString().split('T')[0];
}


// ==========================================
// === الجزء الأول: إضافة الطالب الجديد ===
// ==========================================
if (addStudentForm) {
  addStudentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("newStudentName").value.trim();
    const StudentPhone = document.getElementById("newStudentPhone").value.trim();
    const phone = document.getElementById("newParentPhone").value.trim();
    const academicYear = document.getElementById("newAcademicYear").value;

    const randomCode = "STD-" + Math.floor(1000 + Math.random() * 9000);
    const randomPassword = Math.floor(100000 + Math.random() * 900000).toString();

    // أي دالة تجلب بيانات الطلاب، أضف لها هذا الشرط:
const currentTeacherId = localStorage.getItem('teacher_id');

const { data, error } = await supabaseClient
    .from('students')
      .insert([{
        student_name: name,
        student_phone: StudentPhone,
        parent_phone: phone,
        academic_year: academicYear,
        login_code: randomCode,
        password: randomPassword,
        teacher_id: currentTeacherId // الربط ضروري جداً
      }]); // <--- هذا الشرط يضمن أن المدرس يرى طلابه فقط

    if (error) {
      alert("❌ حدث خطأ أثناء إضافة الطالب: " + error.message);
    } else {
      alert(`✅ تم إضافة الطالب بنجاح!\n\nبيانات الدخول هي:\nكود الدخول: ${randomCode}\nالرقم السري: ${randomPassword}`);
      addStudentForm.reset();
    }
  });
}


// ==========================================
// === الجزء الثاني: تسجيل الحضور والغياب الجماعي ===
// ==========================================
if (attendanceAcademicYear) {
  attendanceAcademicYear.addEventListener('change', async () => {
    const selectedYear = attendanceAcademicYear.value;

    if (!selectedYear) {
      bulkAttendanceTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">برجاء اختيار الصف الدراسي من الأعلى لإظهار قائمة الطلاب...</td></tr>`;
      if (btnSaveBulkAttendance) {
        btnSaveBulkAttendance.disabled = true;
        btnSaveBulkAttendance.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return;
    }

    bulkAttendanceTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-indigo-600 font-medium animate-pulse">جاري سحب دفتر أسماء الصف...</td></tr>`;

    const { data: students, error } = await supabaseClient
      .from('students') // نستخدم جدول الطلاب مباشرة
      .select('student_id, student_name')
      .eq('teacher_id', currentTeacherId)
      .eq('academic_year', selectedYear); // الفلترة الصحيحة

    if (error) {
      bulkAttendanceTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">حدث خطأ أثناء تحميل كشف الأسماء.</td></tr>`;
      return;
    }

    if (!students || students.length === 0) {
      bulkAttendanceTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا يوجد طلاب مسجلين في هذا الصف.</td></tr>`;
      if (btnSaveBulkAttendance) {
        btnSaveBulkAttendance.disabled = true;
        btnSaveBulkAttendance.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return;
    }

    // بناء الجدول
    bulkAttendanceTableBody.innerHTML = '';
    students.forEach(student => {
      bulkAttendanceTableBody.innerHTML += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 student-attendance-row" data-id="${student.student_id}">
          <td class="p-3 font-mono text-slate-400">${student.student_id}</td>
          <td class="p-3 font-bold text-slate-800">${student.student_name}</td>
          <td class="p-3">
            <select class="student-status-select px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium bg-white">
              <option value="حاضر" selected>🟢 حاضر</option>
              <option value="غائب">🔴 غائب</option>
              <option value="مستأذن">🟡 مستأذن</option>
            </select>
          </td>
          <td class="p-3">
            <input type="number" min="0" placeholder="0" class="student-late-input w-20 px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-center text-sm">
          </td>
        </tr>
      `;
    });

    if (btnSaveBulkAttendance) {
      btnSaveBulkAttendance.disabled = false;
      btnSaveBulkAttendance.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  });
}

if (bulkAttendanceForm) {
  bulkAttendanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const sessionDate = attendanceDateInput.value;
    const attendanceRows = document.querySelectorAll('.student-attendance-row');
    const recordsToInsert = [];

    attendanceRows.forEach(row => {
      const studentId = Number(row.getAttribute('data-id'));
      const status = row.querySelector('.student-status-select').value;
      const lateMinutes = Number(row.querySelector('.student-late-input').value) || 0;

      recordsToInsert.push({
        student_id: studentId,
        session_date: sessionDate,
        status: status,
        late_minutes: lateMinutes
      });
    });

    const { error } = await supabaseClient.from('attendance').insert(recordsToInsert);

    if (error) {
      alert("❌ فشل حفظ دفتر الحضور: " + error.message);
    } else {
      alert(`✅ تم تسجيل حضور وغياب الصف بالكامل بنجاح لتاريخ (${sessionDate})!`);
      bulkAttendanceForm.reset();
      attendanceDateInput.value = new Date().toISOString().split('T')[0];
      bulkAttendanceTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">برجاء اختيار الصف الدراسي من الأعلى لإظهار قائمة الطلاب...</td></tr>`;
      btnSaveBulkAttendance.disabled = true;
      btnSaveBulkAttendance.classList.add('opacity-50', 'cursor-not-allowed');
    }
  });
}


// ==========================================
// === الجزء الثالث: رصد درجات الامتحانات الجماعي ===
// ==========================================
if (examAcademicYear) {
  examAcademicYear.addEventListener('change', async () => {
    const selectedYear = examAcademicYear.value;
    
    if (!selectedYear) {
      bulkStudentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">برجاء اختيار الصف الدراسي من الأعلى...</td></tr>`;
      if (btnSaveBulkGrades) {
        btnSaveBulkGrades.disabled = true;
        btnSaveBulkGrades.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return;
    }

    bulkStudentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-emerald-600 font-medium animate-pulse">جاري جلب طلاب هذا الصف...</td></tr>`;

    const { data: students, error } = await supabaseClient
      .from('students')
      .select('student_id, student_name')
      .eq('academic_year', selectedYear)
      .eq('teacher_id', currentTeacherId);


    if (error) {
      bulkStudentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">حدث خطأ أثناء تحميل الطلاب.</td></tr>`;
      return;
    }

    if (!students || students.length === 0) {
      bulkStudentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا يوجد طلاب مسجلين في هذا الصف.</td></tr>`;
      if (btnSaveBulkGrades) {
        btnSaveBulkGrades.disabled = true;
        btnSaveBulkGrades.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return;
    }

    bulkStudentsTableBody.innerHTML = '';
    students.forEach(student => {
      bulkStudentsTableBody.innerHTML += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 student-grade-row" data-id="${student.student_id}">
          <td class="p-3 font-mono text-slate-400">${student.student_id}</td>
          <td class="p-3 font-bold text-slate-800">${student.student_name}</td>
          <td class="p-3">
            <input type="number" step="0.1" min="0" placeholder="0" class="student-score-input w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500">
          </td>
          <td class="p-3">
            <input type="text" placeholder="ملاحظة للطالب" class="student-notes-input w-full px-3 py-1.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
          </td>
        </tr>
      `;
    });

    if (btnSaveBulkGrades) {
      btnSaveBulkGrades.disabled = false;
      btnSaveBulkGrades.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  });
}

if (bulkGradesForm) {
  bulkGradesForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedYear = examAcademicYear.value;
    const examName = document.getElementById('bulkExamName').value.trim();
    const maxScore = Number(document.getElementById('bulkMaxScore').value);
    const todayDate = new Date().toISOString().split('T')[0];

    const { data: examData, error: examError } = await supabaseClient
      .from('exams')
      .insert([{ exam_name: examName, max_score: maxScore, exam_date: todayDate, academic_year: selectedYear }])
      .select('exam_id')
      .single();

    if (examError) {
      alert("❌ حدث خطأ أثناء إنشاء الامتحان: " + examError.message);
      return;
    }

    const gradeRows = document.querySelectorAll('.student-grade-row');
    const recordsToInsert = [];

    gradeRows.forEach(row => {
      const studentId = Number(row.getAttribute('data-id'));
      const teacherNotes = row.querySelector('.student-notes-input').value.trim();
      // درجه الامتحان
      const scoreInput = row.querySelector('.student-score-input');

      // إذا كانت القيمة فارغة أو غير محددة، نعتبرها 0، وإلا نأخذ القيمة المدخلة
    const studentScore = (scoreInput.value === '' || scoreInput.value === null) 
        ? 0 
        : Number(scoreInput.value);

      recordsToInsert.push({
        student_id: studentId,
        exam_id: examData.exam_id,
        student_score: studentScore,
        teacher_notes: teacherNotes
      });
    });

    const { error: gradeError } = await supabaseClient.from('exam_grades').insert(recordsToInsert);

    if (gradeError) {
      alert("❌ فشل رصد درجات الطلاب: " + gradeError.message);
    } else {
      alert(`✅ تم رصد درجات جميع طلاب (${selectedYear}) بنجاح!`);
      bulkGradesForm.reset();
      bulkStudentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">برجاء اختيار الصف الدراسي من الأعلى...</td></tr>`;
      btnSaveBulkGrades.disabled = true;
      btnSaveBulkGrades.classList.add('opacity-50', 'cursor-not-allowed');
    }
  });
}


// ==========================================
// === الجزء الرابع: فلترة وبحث كشف الطلاب الشامل ===
// ==========================================
function renderReportTable(data) {
  if (!reportTableBody) return;
  reportTableBody.innerHTML = "";

  if (data && data.length > 0) {
    data.forEach((student) => {
      const gradesSummary = `${student.total_earned_score} / ${student.total_max_score}`;

      reportTableBody.innerHTML += `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-3 font-mono text-slate-400">${student.student_id}</td>
            <td class="p-3 font-bold text-slate-800">${student.student_name}</td>
            <td class="p-3">
                <span class="font-mono text-xs bg-slate-50 rounded px-2 py-1 border border-slate-100">${student.login_code}</span>
            </td>
            <td class="p-3">
                <span class="font-mono text-xs bg-amber-50 text-amber-700 rounded px-2 py-1 border border-amber-100 font-bold">${student.password}</span>
            </td>
            <td class="p-3 text-emerald-600 font-bold">${gradesSummary}</td>
            <td class="p-3 text-blue-600 font-medium">${student.total_present_days} أيام</td>
            <td class="p-3 text-red-500 font-medium">${student.total_absent_days} أيام</td>
        </tr>
      `;
    });
  } else {
    reportTableBody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-400">لا توجد نتائج مسجلة ومطابقة للبحث.</td></tr>`;
  }
}

if (filterAcademicYear) {
  filterAcademicYear.addEventListener("change", async () => {
    const selectedYear = filterAcademicYear.value;
    if (navSearchInput) navSearchInput.value = "";

    if (!selectedYear) {
      reportTableBody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-400 italic">برجاء اختيار صف دراسي من الأعلى...</td></tr>`;
      return;
    }

    reportTableBody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-indigo-600 font-medium animate-pulse">جاري جلب كشف الطلاب والتقارير...</td></tr>`;

    const { data, error } = await supabaseClient
      .from("student_summary_report")
      .select("*")
      .eq("academic_year", selectedYear)
      .eq('teacher_id', currentTeacherId);

    if (error) {
      console.error("خطأ في جلب التقرير:", error.message);
      reportTableBody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">حدث خطأ أثناء تحميل البيانات.</td></tr>`;
      return;
    }

    renderReportTable(data);
  });
}


// دالة توجيه الواتساب الخاصة بالزرار داخل الجدول
async function sendGroupLink(studentId) {
  const { data, error } = await supabaseClient
    .from('students')
    .select('student_phone, academic_year')
    .eq('student_id', studentId)
    .single();

  if (error || !data || !data.student_phone) {
    alert("❌ لم نجد رقم هاتف مسجل لهذا الطالب.");
    return;
  }

  const link = WHATSAPP_LINKS[data.academic_year];
  if (!link) {
    alert("⚠️ لم يتم تعيين رابط واتساب لهذا الصف الدراسي.");
    return;
  }

  const message = `أهلاً بك يا بطل.. هذا هو رابط مجموعة الواتساب التعليمية الخاصة بصفك الدراسي: ${link}`;
  window.open(`https://wa.me/${data.student_phone}?text=${encodeURIComponent(message)}`, '_blank');
}


// ==========================================================
// === الجزء الخامس: تعديل وحذف بيانات طالب حالي وعملية البحث الذكي ===
// ==========================================================

// تعريف عناصر الواجهة الجديدة للحذف والمودال
// const editSearchIdInput = document.getElementById("editSearchId");
const btnOpenDeleteModal = document.getElementById("btnOpenDeleteModal");
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const btnConfirmDelete = document.getElementById("btnConfirmDelete");
const btnCancelDelete = document.getElementById("btnCancelDelete");
const modalStudentName = document.getElementById("modalStudentName");

currentEditingStudentId = null;
let currentEditingStudentName = ""; // لحفظ الاسم وإظهاره في موديول التأكيد

if (btnFetchStudent) {
  btnFetchStudent.addEventListener("click", async () => {
    const searchVal = editSearchIdInput.value.trim();

    if (!searchVal) {
      alert("📊 برجاء كتابة (ID، اسم، أو كود دخول) الطالب أولاً ليتم جلب بياناته.");
      return;
    }

    btnFetchStudent.innerHTML = `⏳ جاري البحث...`;
    btnFetchStudent.disabled = true;

    let queryBuilder = supabaseClient.from("students").select("*").eq('teacher_id', currentTeacherId);

    if (!isNaN(searchVal) && searchVal !== "") {
      queryBuilder = queryBuilder.eq("student_id", Number(searchVal));
    } else if (searchVal.toUpperCase().startsWith("STD-")) {
      queryBuilder = queryBuilder.eq("login_code", searchVal.toUpperCase());
    } else {
      queryBuilder = queryBuilder.ilike("student_name", `%${searchVal}%`);
    }

    const { data, error } = await queryBuilder;

    btnFetchStudent.innerHTML = `🔍 جلب البيانات للتعديل`;
    btnFetchStudent.disabled = false;

    if (error || !data || data.length === 0) {
      alert("❌ لم نجد أي طالب يطابق بيانات البحث، تأكد من البيانات.");
      if (editStudentForm) editStudentForm.classList.add("opacity-50", "pointer-events-none");
      currentEditingStudentId = null;
      currentEditingStudentName = "";
      return;
    }

    const student = data[0];

    currentEditingStudentId = student.student_id;
    currentEditingStudentName = student.student_name; // حفظ الاسم

    editStudentName.value = student.student_name;
    editStudentPhone.value = student.student_phone;
    editParentPhone.value = student.parent_phone;
    editAcademicYear.value = student.academic_year;

    if (editStudentForm) editStudentForm.classList.remove("opacity-50", "pointer-events-none");
    alert(`🔍 تم العثور على الطالب: (${student.student_name}) بنجاح، يمكنك تعديل بياناته أو حذفه الآن.`);
  });
}

// تنفيذ حفظ التعديلات عند عمل Submit
if (editStudentForm) {
  editStudentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentEditingStudentId) return;

    const { error } = await supabaseClient
      .from("students")
      .update({
        student_name: editStudentName.value.trim(),
        student_phone: editStudentPhone.value.trim(),
        parent_phone: editParentPhone.value.trim(),
        academic_year: editAcademicYear.value,
      })
      .eq("student_id", currentEditingStudentId);

    if (error) {
      alert("❌ فشل تحديث البيانات: " + error.message);
    } else {
      alert("✅ تم تحديث بيانات الطالب بنجاح!");
      resetEditFormState();
    }
  });
}

// --- منطق نافذة التأكيد المنبثقة وحذف الطالب نهائياً ---

// 1. فتح الموديول عند ضغط زر الحذف وعرض اسم الطالب داخله
if (btnOpenDeleteModal) {
  btnOpenDeleteModal.addEventListener("click", () => {
    if (!currentEditingStudentId) return;
    modalStudentName.textContent = currentEditingStudentName;
    deleteConfirmModal.classList.remove("hidden");
  });
}

// 2. إغلاق الموديول عند الضغط على إلغاء الأمر
if (btnCancelDelete) {
  btnCancelDelete.addEventListener("click", () => {
    deleteConfirmModal.classList.add("hidden");
  });
}

// 3. تأكيد الحذف النهائي الفعلي وتنفيذه في قواعد البيانات
if (btnConfirmDelete) {
  btnConfirmDelete.addEventListener("click", async () => {
    if (!currentEditingStudentId) return;

    try {
      btnConfirmDelete.innerHTML = `⏳ جاري الحذف النهائي...`;
      btnConfirmDelete.disabled = true;

      // أ. تنظيف وحذف كافة السجلات المعتمدة على الـ ID لمنع قيود مفاتيح الربط (Foreign Key constraints)
      await supabaseClient.from('attendance').delete().eq('student_id', currentEditingStudentId).eq('teacher_id', currentTeacherId);
      await supabaseClient.from('exam_grades').delete().eq('student_id', currentEditingStudentId).eq('teacher_id', currentTeacherId);
      await supabaseClient.from('payments').delete().eq('student_id', currentEditingStudentId).eq('teacher_id', currentTeacherId);

      // ب. مسح الطالب كلياً من الجدول الرئيسي
      const { error } = await supabaseClient
        .from("students")
        .delete()
        .eq("student_id", currentEditingStudentId)
        .eq('teacher_id', currentTeacherId);

      if (error) throw error;

      alert(`🎯 تم حذف الطالب (${currentEditingStudentName}) وكافة بياناته الملحقة بنجاح من النظام.`);
      
      // جـ. إخفاء الموديول وتصفير الفورم بالكامل
      deleteConfirmModal.classList.add("hidden");
      resetEditFormState();

    } catch (err) {
      console.error("Error executing delete command:", err);
      alert("❌ فشل تنفيذ عملية الحذف، يرجى مراجعة اتصال الإنترنت وصلاحيات قاعدة البيانات.");
    } finally {
      btnConfirmDelete.innerHTML = `نعم، احذف نهائياً`;
      btnConfirmDelete.disabled = false;
    }
  });
}

// دالة مساعدة لتصفير الفورم وقفله بعد النجاح (توفيراً لتكرار الكود)
function resetEditFormState() {
  if (editStudentForm) editStudentForm.reset();
  if (editSearchIdInput) editSearchIdInput.value = "";
  if (editStudentForm) editStudentForm.classList.add("opacity-50", "pointer-events-none");
  currentEditingStudentId = null;
  currentEditingStudentName = "";

  if (typeof filterAcademicYear !== "undefined" && filterAcademicYear && filterAcademicYear.value) {
    filterAcademicYear.dispatchEvent(new Event("change"));
  }
}

// ==========================================
// === الجزء السادس المطور: الـ Modal المخصص لتصفير العام الدراسي ===
// ==========================================
const resetYearModal = document.getElementById('resetYearModal');
const btnOpenResetModal = document.getElementById('btnOpenResetModal');
const btnCancelReset = document.getElementById('btnCancelReset');
const btnConfirmResetFinal = document.getElementById('btnConfirmResetFinal');

// فتح الـ Modal بشكل شيك وبأنيميشن
if (btnOpenResetModal && resetYearModal) {
  btnOpenResetModal.addEventListener('click', () => {
    resetYearModal.classList.remove('hidden');
    setTimeout(() => {
      resetYearModal.classList.remove('opacity-0');
      resetYearModal.querySelector('.bg-white').classList.remove('scale-95');
    }, 10);
  });
}

// إغلاق الـ Modal عند الضغط على تراجع
function closeResetModal() {
  if (resetYearModal) {
    resetYearModal.classList.add('opacity-0');
    resetYearModal.querySelector('.bg-white').classList.add('scale-95');
    setTimeout(() => {
      resetYearModal.classList.add('hidden');
    }, 300);
  }
}

if (btnCancelReset) btnCancelReset.addEventListener('click', closeResetModal);

// تنفيذ عملية الحذف النهائي والتصفير عند التأكيد
if (btnConfirmResetFinal) {
  btnConfirmResetFinal.addEventListener('click', async () => {
    btnConfirmResetFinal.innerHTML = `⏳ جاري الحذف والتصفير...`;
    btnConfirmResetFinal.disabled = true;

    try {
      await supabaseClient.from("exam_grades").delete().neq("student_id", 0).eq('teacher_id', currentTeacherId);
      await supabaseClient.from("attendance").delete().neq("student_id", 0).eq('teacher_id', currentTeacherId);
      await supabaseClient.from("exams").delete().neq("exam_id", 0).eq('teacher_id', currentTeacherId);
      await supabaseClient.from("students").delete().neq("student_id", 0).eq('teacher_id', currentTeacherId);

      alert("✅ عظيم! تم تصفير كافة قواعد البيانات بنجاح تام، والنظام جاهز الآن لاستقبال العام الدراسي الجديد!");
      location.reload();
    } catch (err) {
      alert("❌ حدث خطأ غير متوقع أثناء عملية الحذف: " + err.message);
      btnConfirmResetFinal.innerHTML = `💥 نعم، احذف كل شيء`;
      btnConfirmResetFinal.disabled = false;
      closeResetModal();
    }
  });
}


// ==========================================
// === الجزء السابع: التحكم في الـ Sidebar للموبايل ===
// ==========================================

// السايدبار للموبايل
const mainSidebar = document.getElementById('mainSidebar');
const openSidebarBtn = document.getElementById('openSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
  if(mainSidebar) mainSidebar.classList.remove('translate-x-full');
  if(sidebarOverlay) sidebarOverlay.classList.remove('hidden');
}

function closeSidebar() {
  if(mainSidebar) mainSidebar.classList.add('translate-x-full');
  if(sidebarOverlay) sidebarOverlay.classList.add('hidden');
}

if (openSidebarBtn) openSidebarBtn.addEventListener('click', openSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
// if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);

// إغلاق القائمة عند الضغط على أي رابط بداخلها
const sidebarLinks = mainSidebar.querySelectorAll('a');
sidebarLinks.forEach(link => {
    link.addEventListener('click', closeSidebar);
});

// ==========================================
// === الجزء الثامن: إدارة روابط الواتساب للصفوف الدراسية ===
// ==========================================
const whatsappInputsContainer = document.getElementById('whatsappInputsContainer');
const whatsappSettingsForm = document.getElementById('whatsappSettingsForm');

// 1. دالة لجلب الروابط المخزنة حالياً وعرضها في الخانات فور فتح الصفحة
async function loadWhatsappSettings() {
  if (!whatsappInputsContainer) return;

  const { data, error } = await supabaseClient
    .from('whatsapp_groups')
    .select('*').eq('teacher_id', currentTeacherId);

  if (error) {
    whatsappInputsContainer.innerHTML = `<div class="col-span-2 text-red-500 text-center">❌ فشل تحميل الروابط من قاعدة البيانات</div>`;
    return;
  }

  // بناء خانات الإدخال بناءً على الصفوف الموجودة في الجدول
  whatsappInputsContainer.innerHTML = '';
  data.forEach(item => {
    whatsappInputsContainer.innerHTML += `
      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
          <label class="block text-xs font-bold text-slate-700">${item.academic_year}</label>
          <input type="url" placeholder="https://chat.whatsapp.com/..." 
                 data-year="${item.academic_year}" 
                 value="${item.whatsapp_link || ''}" 
                 class="whatsapp-year-input w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-left" dir="ltr">
      </div>
    `;
  });
}

// 2. حدث حفظ الروابط كلها دفعة واحدة عند الضغط على زر الحفظ
if (whatsappSettingsForm) {
  whatsappSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const inputs = document.querySelectorAll('.whatsapp-year-input');
    const promises = [];

    inputs.forEach(input => {
      const year = input.getAttribute('data-year');
      const link = input.value.trim();

      // إنشاء طلب تحديث لكل صف دراسي
      const updatePromise = supabaseClient
        .from('whatsapp_groups')
        .update({ whatsapp_link: link })
        .eq('academic_year', year);
        
      promises.push(updatePromise);
    });

    // تنفيذ كل عمليات الحفظ في نفس الوقت
    const results = await Promise.all(promises);
    const hasError = results.some(res => res.error);

    if (hasError) {
      alert("❌ حدث خطأ أثناء حفظ بعض الروابط، يرجى المحاولة مرة أخرى.");
    } else {
      alert("✅ تم تحديث روابط مجموعات الواتساب لكل الصفوف بنجاح، وستظهر للطلاب فوراً!");
      loadWhatsappSettings(); // إعادة التحميل للتأكيد
    }
  });
}

// تشغيل الدالة تلقائياً عند فتح صفحة المدرس
loadWhatsappSettings();

// =======================================================================
// === الجزء التاسع المطور: لوحة الإحصائيات المتقدمة وتصدير التقارير المالية الشاملة لـ Excel ===
// =======================================================================

// 1. دالة حساب وعرض الإحصائيات الحية من الجداول في لوحة التحكم المعلم
async function loadAnalyticsDashboard() {
    // أ) جلب إجمالي الطلاب وحساب المراحل
    const { data: students, error: studentErr } = await supabaseClient.from('students').select('academic_year').eq('teacher_id', currentTeacherId);
    
    if (!studentErr && students) {
        document.getElementById('statTotalStudents').textContent = `${students.length} طالب`;
        
        let primaryCount = 0;
        let prepCount = 0;
        let secCount = 0;
        
        students.forEach(st => {
            if (st.academic_year.includes('ابتدائي')) primaryCount++;
            if (st.academic_year.includes('الاعدادي')) prepCount++;
            if (st.academic_year.includes('الثانوي')) secCount++;
        });
        
        document.getElementById('statPrimaryStudents').textContent = `${primaryCount} طالب`;
        document.getElementById('statPrepStudents').textContent = `${prepCount} طالب`;
        document.getElementById('statSecStudents').textContent = `${secCount} طالب`;
    }
}

// 2. كود تصدير التقرير المالي والإداري الخارق الشامل لكل البيانات والمبالغ والأرباح
const btnExportStudentsExcel = document.getElementById('btnExportStudentsExcel');
if (btnExportStudentsExcel) {
    btnExportStudentsExcel.addEventListener('click', async () => {
        btnExportStudentsExcel.innerHTML = `⏳ جاري معالجة البيانات وتوليد التقرير المالي...`;
        btnExportStudentsExcel.disabled = true;

        try {
            // [أ] جلب كافة البيانات المطلوبة بالتوازي من السيرفر لسرعة الأداء
            const [studentsRes, paymentsRes] = await Promise.all([
                supabaseClient.from('students').select('*').eq('teacher_id', currentTeacherId).order('academic_year', { ascending: true }),
                supabaseClient.from('payments').select('*, students(student_name, academic_year)').eq('teacher_id', currentTeacherId)
            ]);

            if (studentsRes.error) throw studentsRes.error;
            if (paymentsRes.error) throw paymentsRes.error;

            const allStudents = studentsRes.data || [];
            const allPayments = paymentsRes.data || [];

            // ==========================================
            // 📊 1. بناء الشيت الأول: ملخص الأداء المالي والإداري العام
            // ==========================================
            
            // حساب أعداد طلاب كل صف دراسي ديناميكياً
            const academicYearsDict = {};
            // حساب أرباح كل شهر ديناميكياً
            const monthlyProfitsDict = {};
            let totalSystemRevenue = 0;

            allStudents.forEach(st => {
                academicYearsDict[st.academic_year] = (academicYearsDict[st.academic_year] || 0) + 1;
            });

            allPayments.forEach(pay => {
                if (pay.payment_status === 'تم الدفع') {
                    const amount = Number(pay.amount_paid) || 0;
                    monthlyProfitsDict[pay.month_name] = (monthlyProfitsDict[pay.month_name] || 0) + amount;
                    totalSystemRevenue += amount;
                }
            });

            // تحضير مصفوفة البيانات للشيت الرئيسي (Key -> Value)
            const summaryData = [
                { "المؤشر المالي والإداري": "إجمالي عدد الطلاب المسجلين بالمنصة", "القيمة / الإحصائية": `${allStudents.length} طالب` },
                { "المؤشر المالي والإداري": "إجمالي الأرباح والإيرادات الكلية المجمعة", "القيمة / الإحصائية": `${totalSystemRevenue} جنيه مصري` },
                { "المؤشر المالي والإداري": "----------------------------------------", "القيمة / الإحصائية": "-------------------" }
            ];

            // إضافة توزيع الطلاب حسب الصفوف
            summaryData.push({ "المؤشر المالي والإداري": "📊 توزيع أعداد الطلاب حسب الصفوف الدراسية:", "القيمة / الإحصائية": "" });
            Object.keys(academicYearsDict).forEach(year => {
                summaryData.push({ "المؤشر المالي والإداري": `عدد طلاب (${year})`, "القيمة / الإحصائية": `${academicYearsDict[year]} طالب` });
            });

            summaryData.push({ "المؤشر المالي والإداري": "----------------------------------------", "القيمة / الإحصائية": "-------------------" });
            summaryData.push({ "المؤشر المالي والإداري": "💰 صافي الإيرادات والأرباح المحصلة بكل شهر مالي:", "القيمة / الإحصائية": "" });
            
            // إضافة أرباح الشهور المحصلة بالفعل
            if (Object.keys(monthlyProfitsDict).length === 0) {
                summaryData.push({ "المؤشر المالي والإداري": "لم يتم تحصيل أي مبالغ بعد", "القيمة / الإحصائية": "0 جنيه" });
            } else {
                Object.keys(monthlyProfitsDict).forEach(month => {
                    summaryData.push({ "المؤشر المالي والإداري": `إيرادات شهر (${month})`, "القيمة / الإحصائية": `${monthlyProfitsDict[month]} جنيه مصري` });
                });
            }

            // ==========================================
            // 💵 2. بناء الشيت الثاني: حركة المصروفات والسداد التفصيلي للشهور
            // ==========================================
            const paymentDetailedData = allPayments.map((pay, index) => {
                // استخراج بيانات الطالب المرتبطة بالسجل منعاً للأخطاء برمجياً
                const studentName = pay.students ? pay.students.student_name : 'طالب محذوف أو غير معرف';
                const academicYear = pay.students ? pay.students.academic_year : 'غير محدد';
                
                return {
                    "مسلسل الحظر المالي": index + 1,
                    "كود الطالب التعريفي ID": pay.student_id,
                    "اسم الطالب": studentName,
                    "الصف الدراسي": academicYear,
                    "الشهر المستهدف": pay.month_name,
                    "المبلغ المدفوع (جنيه)": pay.amount_paid,
                    "حالة السداد الحالية": pay.payment_status,
                    "تاريخ السداد بالسيرفر": pay.created_at ? new Date(pay.created_at).toLocaleDateString('ar-EG') : 'غير محدد'
                };
            });

            // ==========================================
            // 👥 3. بناء الشيت الثالث: كشف الحسابات العام للطلاب
            // ==========================================
            const studentsGeneralData = allStudents.map((st, index) => ({
                "مسلسل": index + 1,
                "الرقم التعريفي ID": st.student_id,
                "اسم الطالب": st.student_name,
                "الصف الدراسي": st.academic_year,
                "رقم هاتف الطالب": st.student_phone,
                "رقم هاتف ولي الأمر": st.parent_phone,
                "كود الدخول للمنصة": st.login_code,
                "كلمة المرور": st.password
            }));

            // ==========================================
            // 🏭 عمليات التوليد والربط بمكتبة XLSX السحرية
            // ==========================================
            const workbook = XLSX.utils.book_new();

            // تحويل المصفوفات لشيتات منفصلة
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);
            const wsPayments = XLSX.utils.json_to_sheet(paymentDetailedData);
            const wsStudents = XLSX.utils.json_to_sheet(studentsGeneralData);

            // تفعيل التوجيه من اليمين إلى اليسار (RTL) لجميع الشيتات لتبدو عربية ومنظمة جداً عند الطباعة
            wsSummary['!dir'] = "rtl";
            wsPayments['!dir'] = "rtl";
            wsStudents['!dir'] = "rtl";

            // إضافة الصفحات المنفصلة داخل نفس ملف الإكسيل
            XLSX.utils.book_append_sheet(workbook, wsSummary, "📊 الخصائص والملخص المالي");
            XLSX.utils.book_append_sheet(workbook, wsPayments, "💵 سجل المصروفات التفصيلي");
            XLSX.utils.book_append_sheet(workbook, wsStudents, "👥 قائمة الحسابات والطلاب");

            // تحميل الملف فوراً على جهاز المعلم بالاسم والتاريخ الحاليين للتوثيق الإداري السنوي
            const today = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `التقرير_المالي_والإداري_الشامل_${today}.xlsx`);

            alert("✅ رائع جداً! تم توليد وتصدير التقرير المالي والإداري الشامل بنجاح. ستجد الملف يحتوي على 3 صفحات مخصصة ومفصلة بالكامل.");

        } catch (err) {
            console.error("خطأ أثناء تصدير ملف الإكسيل:", err);
            alert("❌ فشل تصدير التقرير الشامل، تأكد من سلامة اتصالك بالإنترنت وتوفر مكتبة XLSX بالصفحة.");
        } finally {
            btnExportStudentsExcel.innerHTML = `🟢 تصدير التقرير المالي والإداري لـ Excel`;
            btnExportStudentsExcel.disabled = false;
        }
    });
}

// تشغيل تحليلات اللوحة فور الفتح لراحة المعلم
loadAnalyticsDashboard();



// معرفات العناصر
const payAcademicYearSelect = document.getElementById('payAcademicYearSelect');
const payMonthSelect = document.getElementById('payMonthSelect');
const payAmountInput = document.getElementById('payAmountInput');
const btnFetchPayStudents = document.getElementById('btnFetchPayStudents');
const paymentRosterTableBody = document.getElementById('paymentRosterTableBody');

// عند الضغط على زر عرض الطلاب للرصد المالي
btnFetchPayStudents.addEventListener('click', async () => {
    const selectedYear = payAcademicYearSelect.value;
    const selectedMonth = payMonthSelect.value;
    const amount = Number(payAmountInput.value) || 0;

    btnFetchPayStudents.innerHTML = `⏳ جاري سحب القوائم الماليّة...`;
    btnFetchPayStudents.disabled = true;

    // 1. جلب جميع طلاب هذا الصف أولاً
    const { data: students, error: studentError } = await supabaseClient
        .from('students')
        .select('student_id, student_name, login_code')
        .eq('academic_year', selectedYear).eq('teacher_id', currentTeacherId);

    if (studentError || !students || students.length === 0) {
        paymentRosterTableBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-500 font-medium">⚠️ لا يوجد طلاب مسجلين في هذا الصف حالياً.</td></tr>`;
        btnFetchPayStudents.innerHTML = `🔍 عرض طلاب الصف لرصد الحسابات`;
        btnFetchPayStudents.disabled = false;
        return;
    }

    // 2. جلب حركات الدفع المسجلة لهذا الشهر عشان نعرف مين دافع ومين لأ
    const { data: payments } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('month_name', selectedMonth).eq('teacher_id', currentTeacherId);

    // تحويل المصفوفة لـ Map لسهولة الفحص السريع بالـ Student ID
    const payMap = new Map();
    if (payments) {
        payments.forEach(p => payMap.set(p.student_id, p));
    }

    // 3. بناء الجدول لعرض الطلاب
    paymentRosterTableBody.innerHTML = '';
    students.forEach(student => {
        const hasPaidRecord = payMap.get(student.student_id);
        const currentStatus = hasPaidRecord ? hasPaidRecord.payment_status : 'لم يدفع';
        
        // تنسيق الألوان بناءً على الحالة
        const badgeClass = currentStatus === 'تم الدفع' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600';
        
        // تحديد نص وزر الإجراء
        const btnText = currentStatus === 'تم الدفع' ? 'إلغاء السداد ❌' : 'تأكيد السداد 💵';
        const btnClass = currentStatus === 'تم الدفع' ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' : 'bg-emerald-600 hover:bg-emerald-700 text-white';

        paymentRosterTableBody.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="p-3 font-mono font-bold text-slate-500">${student.student_id}</td>
                <td class="p-3 font-bold text-slate-800">${student.student_name}</td>
                <td class="p-3 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded w-max">${student.login_code}</td>
                <td class="p-3">
                    <span id="badge-${student.student_id}" class="px-2.5 py-1 rounded-lg text-xs font-bold ${badgeClass}">
                        ${currentStatus}
                    </span>
                </td>
                <td class="p-3 text-center">
                    <button onclick="togglePaymentStatus(${student.student_id}, '${selectedMonth}', ${amount}, '${currentStatus}')" id="btn-pay-${student.student_id}" class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${btnClass}">
                        ${btnText}
                    </button>
                </td>
            </tr>
        `;
    });

    btnFetchPayStudents.innerHTML = `🔍 عرض طلاب الصف لرصد الحسابات`;
    btnFetchPayStudents.disabled = false;
});

// دالة سحرية لتغيير حالة الدفع فوراً عند الضغط على الزرار
async function togglePaymentStatus(studentId, monthName, amount, currentStatus) {
    const btn = document.getElementById(`btn-pay-${studentId}`);
    const badge = document.getElementById(`badge-${studentId}`);
    
    btn.disabled = true;
    btn.textContent = "⏳...";

    if (currentStatus === 'لم يدفع') {
        // الطالب لم يدفع -> نقوم بإدخال سجل دفع جديد (تم الدفع)
        const { error } = await supabaseClient
            .from('payments')
            .insert([{
                student_id: studentId,
                month_name: monthName,
                amount_paid: amount,
                payment_status: 'تم الدفع'
            }]);

        if (!error) {
            badge.textContent = 'تم الدفع';
            badge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600';
            btn.className = 'px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-600';
            btn.textContent = 'إلغاء السداد ❌';
            // تحديث الحالة المخزنة في الـ onclick للزرار للتحول التالي
            btn.setAttribute('onclick', `togglePaymentStatus(${studentId}, '${monthName}', ${amount}, 'تم الدفع')`);
        } else { alert("❌ حدث خطأ أثناء تسجيل الدفع في السيرفر."); }
    } else {
        // الطالب دافع وعايزين نلغي الدفع -> نقوم بحذف حركته المالية لهذا الشهر
        const { error } = await supabaseClient
            .from('payments')
            .delete()
            .eq('student_id', studentId)
            .eq('month_name', monthName);

        if (!error) {
            badge.textContent = 'لم يدفع';
            badge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600';
            btn.className = 'px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white';
            btn.textContent = 'تأكيد السداد 💵';
            btn.setAttribute('onclick', `togglePaymentStatus(${studentId}, '${monthName}', ${amount}, 'لم يدفع')`);
        } else { alert("❌ حدث خطأ أثناء إلغاء السداد في السيرفر."); }
    }
    btn.disabled = false;
}
statLastAttendanceRatio