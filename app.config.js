module.exports = {
  expo: {
    name: 'Connect Pro',
    slug: 'connect-pro-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'connectpro',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#0C5849'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.websoltan.connectpro',
      infoPlist: {
        NSMicrophoneUsageDescription: 'برای ارسال پیام صوتی به دسترسی میکروفن نیاز است.',
        NSPhotoLibraryUsageDescription: 'برای ارسال تصویر به دسترسی تصاویر نیاز است.'
      }
    },
    android: {
      package: 'com.websoltan.connectpro',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0C5849'
      },
      permissions: ['RECORD_AUDIO', 'POST_NOTIFICATIONS'],
      notification: {
        icon: './assets/notification-icon.png',
        color: '#0C5849'
      }
    },
    plugins: [
      'expo-secure-store',
      'expo-notifications',
      [
        'expo-image-picker',
        {
          photosPermission: 'برای ارسال تصویر در گفتگو به دسترسی تصاویر نیاز است.',
          cameraPermission: 'برای ثبت و ارسال تصویر به دوربین نیاز است.'
        }
      ],
      [
        'expo-av',
        {
          microphonePermission: 'برای ارسال پیام صوتی به دسترسی میکروفن نیاز است.'
        }
      ]
    ],
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || undefined
      }
    }
  }
};
