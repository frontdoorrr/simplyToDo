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
    
    // URL schemes for social authentication
    schemes: [
      "simplytodo",
      // Google OAuth URL scheme will be added dynamically based on client ID
    ],
    
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
        NSPhotoLibraryUsageDescription: "SimplyToDo needs photo library access to attach images to your tasks (if this feature is enabled).",
        // Apple Sign In Capability
        "com.apple.developer.applesignin": ["Default"],
        // Google Sign-In URL scheme (will be set dynamically)
        CFBundleURLTypes: [
          {
            CFBundleURLName: "google-signin",
            CFBundleURLSchemes: [
              // Use iOS client ID if available, otherwise use web client ID
              process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 
              process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
              "com.googleusercontent.apps.placeholder"
            ]
          }
        ]
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
      ],
      // Google Sign-In 플러그인 (개발 환경에서 안전하게 처리)
      ...(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? [[
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 
                       process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
        }
      ]] : []),
      // Apple Sign-In 플러그인 (필요시 나중에 추가)
      // ...(process.env.EXPO_PUBLIC_APPLE_SIGNIN_ENABLED ? [[
      //   "@invertase/react-native-apple-authentication",
      //   {
      //     ios: {
      //       minimumVersion: "13.0"
      //     }
      //   }
      // ]] : [])
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