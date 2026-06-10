# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# expo-av FullscreenVideoPlayer references an optional KeepAwakeManager interface
# that isn't on the classpath; R8 full-mode treats the missing reference as an error.
# Suppressing is safe — the keep-awake path is inert without the class. (from R8 missing_rules.txt)
-dontwarn expo.modules.core.interfaces.services.KeepAwakeManager

# Add any project specific keep options here:
