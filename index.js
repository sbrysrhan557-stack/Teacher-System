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
    e.preventDefault(); // منع الصفحة من الريفرش الافتراضي عند الإرسال
    
    // إخفاء رسالة الخطأ القديمة إن وجدت
    errorMessage.classList.add('hidden');
    errorMessage.textContent = "";

    // جلب القيم وتنظيف الفراغات الزائدة
    const code = loginCodeInput.value.trim();
    const pass = passwordInput.value.trim();

    // التحقق من أن الحقول ليست فارغة
    if (!code || !pass) {
        errorMessage.textContent = "❌ برجاء إدخال كود المستخدم والرقم السري.";
        errorMessage.classList.remove('hidden');
        return;
    }

    try {
        // الاستعلام من جدول الطلاب للبحث عن الكود والباسورد المتطابقين
        // جلبنا عمود الـ role لمعرفة هل الحساب الحالي (مدرس أم طالب)
        const { data, error } = await supabaseClient
            .from('students')
            .select('student_id, student_name, academic_year, role')
            .eq('login_code', code)
            .eq('password', pass) 
            .single(); // متوقع يرجع سجل واحد فقط لأن الكود فريد (Unique)

        if (error || !data) {
            // لو الكود أو الباسورد خطأ أو الحساب غير موجود
            errorMessage.textContent = "❌ الكود أو الرقم السري غير صحيح، تأكد وأعد المحاولة.";
            errorMessage.classList.remove('hidden');
            return;
        }

        // ==========================================
        // 4. نظام التوجيه وحفظ الجلسة (Routing)
        // ==========================================
        
        // مسح أي بيانات قديمة مخزنة في المتصفح منعاً للتداخل
        localStorage.clear();

        // التوجيه بناءً على الرتبة (role)
        if (data.role === 'teacher') {
            // أ) إذا كان المستخدم هو المدرس:
            console.log("تم تسجيل دخول المعلم بنجاح:", data.student_name);
            
            // حفظ راية (Flag) تثبت أن المستخدم مدرس لحماية الصفحات
            localStorage.setItem('is_teacher', 'true');
            localStorage.setItem('teacher_name', data.student_name);

            alert(`🔐 مرحباً بك يا مستر ${data.student_name}، جاري فتح لوحة تحكم المعلم...`);
            window.location.href = "./teacher/teacher.html"; 

        } else {
            // ب) إذا كان المستخدم طالباً عادياً:
            console.log("تم تسجيل الدخول بنجاح للطالب:", data.student_name);
            
            // حفظ بيانات الطالب في الـ LocalStorage لاستخدامها في صفحة الـ dashboard
            localStorage.setItem('current_student_id', data.student_id);
            localStorage.setItem('current_student_name', data.student_name);
            localStorage.setItem('current_student_year', data.academic_year);

            alert(`👋 أهلاً بك يا ${data.student_name}، جاري الانتقال للوحة المتابعة الخاصة بك...`);
            window.location.href = "dashboard/dashboard.html"; 
        }

    } catch (err) {
        console.error("خطأ غير متوقع أثناء تسجيل الدخول:", err);
        errorMessage.textContent = "❌ حدث خطأ غير متوقع في الاتصال بالشبكة، يرجى المحاولة لاحقاً.";
        errorMessage.classList.remove('hidden');
    }
});