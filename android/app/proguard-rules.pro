# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# === Asoria App Rules ===

# Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ARCore
-keep class com.google.ar.** { *; }
-keep class com.asoria.ar.** { *; }

# Supabase
-keep class io.supabase.** { *; }
-keep class org.openapitools.** { *; }
-dontwarn io.supabase.**
-dontwarn org.openapitools.**

# Stripe
-keep class com.stripe.** { *; }
-dontwarn com.stripe.**

# FlashList
-keep class com.shopify.flashlist.** { *; }

# Expo modules
-keep class expo.** { *; }
-dontwarn expo.modules.**

# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Three.js / R3F (if bundled)
-keep class org.threejs.** { *; }
-dontwarn org.threejs.**

# Firebase (Cloud Functions used by notifications)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep data classes used in network serialization
-keep class asoria.app.types.** { *; }
-keep class asoria.app.services.** { *; }