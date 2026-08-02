const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || process.env.EXPO_PROJECT_ID;

module.exports = {
  expo: {
    name: 'Connect Pro',
    slug: 'connect-pro-mobile',
    version: '1.0.2',
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
      versionCode: 3,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0C5849'
      },
      permissions: ['RECORD_AUDIO', 'POST_NOTIFICATIONS']
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#0C5849'
        }
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'برای ارسال تصویر در گفتگو به دسترسی تصاویر نیاز است.',
          cameraPermission: 'برای ثبت و ارسال تصویر به دوربین نیاز است.'
        }
      ]
    ],
    extra: {
      eas: {
        projectId
      }
    }
  }
};
