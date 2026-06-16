const SUPABASE_URL = "https://mtwwslednzzseoihsbrb.supabase.co";
        const SUPABASE_ANON_KEY = "sb_publishable_7kYHCVI_a9jNIOiKTEd-sQ_S9VMkWYg";
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const studentId = Number(localStorage.getItem('current_student_id'));
        const studentName = localStorage.getItem('current_student_name');
        const studentYear = localStorage.getItem('current_student_year');

        // حماية لو لم يسجل دخول
        if (!studentId) { window.location.href = "login.html"; }

        document.getElementById('welcomeMessage').textContent = `مرحباً بك يا ${studentName}`;
        document.getElementById('studentYearDisplay').textContent = `الصف الدراسي: ${studentYear}`;

        // 1. جلب رابط الواتساب الخاص بالصف
        async function loadStudentWhatsappLink() {
            const whatsappGroupCard = document.getElementById('whatsappGroupCard');
            const btnJoinWhatsapp = document.getElementById('btnJoinWhatsapp');
            if(!whatsappGroupCard || !studentYear) return;

            const { data } = await supabaseClient.from('whatsapp_groups').select('whatsapp_link').eq('academic_year', studentYear).single();
            if (data && data.whatsapp_link && data.whatsapp_link.trim() !== "") {
                btnJoinWhatsapp.href = data.whatsapp_link.trim();
                whatsappGroupCard.classList.remove('hidden');
            }
        }

        // 2. 💵 جلب وفحص مادية الحساب للشهر الحالي
        async function checkStudentPayments() {
            const statusElem = document.getElementById('studentMonthStatus');
            if (!statusElem) return;

            const { data, error } = await supabaseClient.from('payments').select('*').eq('student_id', studentId).order('payment_date', { ascending: false }).limit(1);

            if (!error && data && data.length > 0) {
                statusElem.textContent = `${data[0].month_name} (${data[0].payment_status})`;
                statusElem.className = data[0].payment_status === 'تم الدفع' ? "text-sm font-black text-emerald-600 mt-0.5" : "text-sm font-black text-red-500 mt-0.5";
            } else {
                statusElem.textContent = "❌ غير مسدد / لا توجد وصولات";
                statusElem.className = "text-xs font-bold text-red-500 mt-0.5";
            }
        }

        // 3. 📚 جلب المذكرات الخاصة بالصف الحالي فقط
        async function loadStudentMaterials() {
            const container = document.getElementById('studentMaterialsContainer');
            if (!container) return;

            const { data } = await supabaseClient.from('study_materials').select('*').eq('academic_year', studentYear).order('created_at', { ascending: false });

            container.innerHTML = '';
            if (!data || data.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center text-slate-400 py-2 text-xs italic">لا توجد مذكرات مرفوعة لصفك حالياً.</div>`;
                return;
            }

            data.forEach(item => {
                container.innerHTML += `
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center transition-all hover:border-amber-200">
                        <div>
                            <h4 class="font-bold text-slate-800 text-xs">${item.material_name}</h4>
                            <p class="text-[9px] text-slate-400">📅 جاهز للتحميل السحابي</p>
                        </div>
                        <a href="${item.material_link}" target="_blank" class="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap">📥 تحميل PDF</a>
                    </div>`;
            });
        }

        // 4. جلب الحضور والغياب
        async function loadAttendance() {
            const { data } = await supabaseClient.from('attendance').select('*').eq('student_id', studentId).order('session_date', { ascending: false });
            const tableBody = document.getElementById('attendanceTable');
            tableBody.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(row => {
                    tableBody.innerHTML += `
                        <tr class="border-b border-slate-100 hover:bg-slate-50">
                            <td class="p-3">${row.session_date}</td>
                            <td class="p-3"><span class="px-2 py-0.5 rounded text-xs font-medium ${row.status === 'حاضر'?'text-emerald-600 bg-emerald-50':'text-red-600 bg-red-50'}">${row.status}</span></td>
                            <td class="p-3 text-xs text-slate-500">${row.late_minutes} دقيقة</td>
                        </tr>`;
                });
            } else { tableBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-400 text-xs">لا يوجد سجل حضور.</td></tr>`; }
        }

        // 5. جلب درجات الامتحانات والـ Join
        async function loadGrades() {
            const { data } = await supabaseClient.from('exam_grades').select('student_score, teacher_notes, exams ( exam_name, max_score )').eq('student_id', studentId);
            const tableBody = document.getElementById('gradesTable');
            tableBody.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(row => {
                    if (row.exams) {
                        tableBody.innerHTML += `
                            <tr class="border-b border-slate-100 hover:bg-slate-50">
                                <td class="p-3 font-medium text-slate-800">${row.exams.exam_name}</td>
                                <td class="p-3 text-indigo-600 font-bold">${row.student_score}</td>
                                <td class="p-3 text-slate-400 font-mono">${row.exams.max_score}</td>
                                <td class="p-3 text-xs text-slate-400 italic">${row.teacher_notes || 'لا يوجد'}</td>
                            </tr>`;
                    }
                });
            } else { tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 text-xs">لا توجد درجات مسجلة.</td></tr>`; }
        }

        // زرار تسجيل الخروج
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.clear(); window.location.href = "../login/login.html";
        });

        // تشغيل كافة العمليات عند الفتح فوراً
        loadStudentWhatsappLink();
        checkStudentPayments();
        loadStudentMaterials();
        loadAttendance();
        loadGrades();