// ==========================================
// 1. إعداد الاتصال بـ Supabase
// ==========================================
const SUPABASE_URL = "https://mtwwslednzzseoihsbrb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7kYHCVI_a9jNIOiKTEd-sQ_S9VMkWYg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. الإمساك بعناصر الصفحة (DOM Elements)
// ==========================================
const loginForm = document.getElementById('loginForm');
const loginCodeInput = document.getElementById('loginCode');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');

// ==========================================
// 3. الاستماع لحدث إرسال الفورم (Submit)
// ==========================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorMessage.classList.add('hidden');
    errorMessage.textContent = "";

    const code = loginCodeInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!code || !pass) {
        errorMessage.textContent = "❌ برجاء إدخال كود المستخدم والرقم السري.";
        errorMessage.classList.remove('hidden');
        return;
    }

    try {
        // أولاً: محاولة تسجيل الدخول كمدرس
        const { data: teacherData, error: teacherError } = await supabaseClient
            .from('teachers')
            .select('teacher_id, teacher_name')
            .eq('login_code', code)
            .eq('password', pass)
            .single();

        if (teacherData) {
            // إذا وجد المدرس
            localStorage.clear();
            localStorage.setItem('is_teacher', 'true');
            localStorage.setItem('teacher_id', teacherData.teacher_id); // هام جداً
            localStorage.setItem('teacher_name', teacherData.teacher_name);

            alert(`🔐 مرحباً بك يا مستر ${teacherData.teacher_name}، جاري فتح لوحة التحكم...`);
            window.location.href = "./teacher/teacher.html";
            return;
        }

        // ثانياً: إذا لم يكن مدرساً، نحاول تسجيل الدخول كطالب
        const { data: studentData, error: studentError } = await supabaseClient
            .from('students')
            .select('student_id, student_name, academic_year')
            .eq('login_code', code)
            .eq('password', pass)
            .single();

        if (studentData) {
            // إذا وجد الطالب
            localStorage.clear();
            localStorage.setItem('current_student_id', studentData.student_id);
            localStorage.setItem('current_student_name', studentData.student_name);
            localStorage.setItem('current_student_year', studentData.academic_year);

            alert(`👋 أهلاً بك يا ${studentData.student_name}، جاري الانتقال للوحة المتابعة...`);
            window.location.href = "dashboard/dashboard.html";
            return;
        }

        // إذا لم يتم العثور عليه في أي من الجدولين
        errorMessage.textContent = "❌ الكود أو الرقم السري غير صحيح.";
        errorMessage.classList.remove('hidden');

    } catch (err) {
        console.error("خطأ أثناء تسجيل الدخول:", err);
        errorMessage.textContent = "❌ حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.";
        errorMessage.classList.remove('hidden');
    }
});