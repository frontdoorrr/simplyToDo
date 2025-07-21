export default ({ config }) => {
  const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';
  
  return {
    ...config,
    name: "SimplyToDo",
    slug: "simplytodo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "simplytodo",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.simplytodo.app",
      buildNumber: "1",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: !isProduction // Only allow in development
        },
        NSUserNotificationsUsageDescription: "SimplyToDo uses notifications to remind you about your tasks and deadlines.",
        NSCameraUsageDescription: "SimplyToDo needs camera access to take photos for your tasks (if this feature is enabled).",
        NSPhotoLibraryUsageDescription: "SimplyToDo needs photo library access to attach images to your tasks (if this feature is enabled)."
      }
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#4caf50"
      },
      package: "com.simplytodo.app",
      versionCode: 1,
      permissions: [
        "NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK"
      ]
    },
    
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#4caf50"
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#4caf50",
          defaultChannel: "default"
        }
      ]
    ],
    
    experiments: {
      typedRoutes: true
    },
    
    primaryColor: "#4caf50",
    
    extra: {
      eas: {
        projectId: "your-eas-project-id" // Will be filled when setting up EAS
      }
    },
    
    // Production optimizations
    updates: {
      fallbackToCacheTimeout: 0
    },
    
    assetBundlePatterns: [
      "**/*"
    ]
  };
};