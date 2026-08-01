# Connect Pro Mobile

اپ مدیریتی کانکت پرو برای Android و iOS، ساخته‌شده با React Native و Expo.

## امکانات

- ورود امن با WordPress Application Password
- دریافت رنگ‌ها و هویت بصری از تنظیمات کانکت پرو
- فهرست گفتگوها با جستجو، فیلتر و بروزرسانی خودکار
- نمایش پیام‌ها به سبک پیام‌رسان‌های اجتماعی
- پاسخ متنی، تصویر، فایل PDF/Word و پیام صوتی
- ریپلای روی پیام‌ها
- تغییر وضعیت گفتگو، کانال پاسخ‌گویی و تخصیص کارشناس یا واحد
- نمایش اطلاعات فرم‌های سناریویی
- گزارش عملکرد و امتیاز کارشناسان
- مدیریت تنظیمات عملیاتی افزونه و فعال/غیرفعال‌کردن کارشناسان
- Push Notification از طریق Expo Push Service
- ذخیره اطلاعات اتصال در SecureStore دستگاه

## پیش‌نیاز سایت

1. افزونه `Connect Pro 2.8.0 Mobile Ready` را نصب و فعال کنید.
2. سایت باید HTTPS معتبر داشته باشد.
3. در وردپرس به «کاربران ← شناسنامه شما ← رمزهای برنامه» بروید.
4. یک رمز با نام `Connect Pro Mobile` بسازید.
5. کاربر باید دسترسی مدیریت گفتگوهای کانکت پرو را داشته باشد.

## اجرای پروژه

```bash
npm install
npx expo start
```

## فعال‌سازی اعلان موبایل

برای دریافت Expo Push Token یک پروژه EAS بسازید و شناسه آن را تنظیم کنید:

```bash
export EXPO_PUBLIC_EAS_PROJECT_ID="YOUR-EAS-PROJECT-ID"
npx expo start
```

در ویندوز PowerShell:

```powershell
$env:EXPO_PUBLIC_EAS_PROJECT_ID="YOUR-EAS-PROJECT-ID"
npx expo start
```

## ساخت Android و iOS

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

برای انتشار نهایی، مقادیر `android.package` و `ios.bundleIdentifier` در `app.config.js` را با شناسه رسمی برند خود هماهنگ کنید.

## معماری امنیتی

اپ به دیتابیس وردپرس متصل نمی‌شود. تمام ارتباطات از REST API اختصاصی کانکت پرو عبور می‌کند. احراز هویت با Application Password داخلی وردپرس انجام می‌شود و رمز در SecureStore سیستم‌عامل نگهداری می‌شود. کلید هوش مصنوعی و سایر اطلاعات محرمانه از API اپ خارج نمی‌شوند.
