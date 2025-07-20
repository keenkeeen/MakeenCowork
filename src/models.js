// مدل کاربر
/**
 * @typedef {Object} User
 * @property {string} id - شناسه یکتا
 * @property {string} type - نوع کاربر ('normal' | 'cowork-forced')
 * @property {string} name - نام
 * @property {string} family - نام خانوادگی
 * @property {string} phone - شماره تماس
 * @property {string} [nationalId] - کد ملی (در صورت دانشجوی دوره)
 * @property {string} [idDocType] - نوع مدرک شناسایی (کارت ملی، گواهینامه، سایر)
 * @property {string} [idDocOther] - توضیح مدرک شناسایی (در صورت انتخاب سایر)
 * @property {string} [emergencyPhone] - شماره تماس اضطراری
 * @property {string} [desc] - توضیحات
 * @property {boolean} isBootcamp - آیا دانشجوی بوتکمپ است؟
 * @property {number} [bootcampRound] - دوره چندم (در صورت بوتکمپ)
 * @property {string} [bootcampType] - نوع بوتکمپ (فرانت‌اند، بک‌اند، UI/UX)
 * @property {Subscription[]} subscriptions - لیست اشتراک‌ها
 * @property {Attendance[]} attendances - لیست حضورها (کوورک)
 * @property {CourseAttendance[]} courseAttendances - لیست حضورها (کلاس‌های دوره)
 * @property {CourseOutSession[]} courseOutSessions - لیست خروج‌های موقت (کلاس‌های دوره)
 * @property {Debt[]} debts - لیست بدهی‌ها
 * @property {AbsenceCall[]} absenceCalls - تماس‌های غیبت
 */

// مدل اشتراک
/**
 * @typedef {Object} Subscription
 * @property {string} id - شناسه یکتا
 * @property {number} days - تعداد روزهای اشتراک
 * @property {string} startDate - تاریخ شروع
 * @property {string} [endDate] - تاریخ پایان (در صورت اتمام)
 * @property {boolean} paid - آیا پرداخت شده؟
 * @property {number} [amount] - مبلغ
 */

// مدل حضور (کوورک)
/**
 * @typedef {Object} Attendance
 * @property {string} id - شناسه یکتا
 * @property {string} date - تاریخ حضور (yyyy-mm-dd)
 * @property {string} enterTime - ساعت ورود
 * @property {string} [exitTime] - ساعت خروج
 */

// مدل حضور (کلاس‌های دوره)
/**
 * @typedef {Object} CourseAttendance
 * @property {string} id - شناسه یکتا
 * @property {string} date - تاریخ کلاس (yyyy-mm-dd)
 * @property {string} enterTime - ساعت ورود
 * @property {string} [exitTime] - ساعت خروج
 * @property {string} [note] - یادداشت (مثل دلیل غیبت)
 */

// مدل خروج موقت (کلاس‌های دوره)
/**
 * @typedef {Object} CourseOutSession
 * @property {string} date - تاریخ خروج موقت (yyyy-mm-dd)
 * @property {string} start - ساعت شروع خروج موقت
 * @property {string} [end] - ساعت پایان خروج موقت
 */

// مدل بدهی
/**
 * @typedef {Object} Debt
 * @property {string} id - شناسه یکتا
 * @property {number} amount - مبلغ بدهی
 * @property {string} reason - دلیل بدهی
 * @property {string} date - تاریخ ثبت بدهی
 * @property {boolean} paid - آیا پرداخت شده؟
 */

// تماس غیبت
/**
 * @typedef {Object} AbsenceCall
 * @property {string} id - شناسه یکتا
 * @property {string} date - تاریخ تماس
 * @property {string} reason - دلیل غیبت یا توضیح تماس
 */ 