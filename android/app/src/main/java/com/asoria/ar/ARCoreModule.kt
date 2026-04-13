package com.asoria.ar

import android.app.Activity
import android.content.Context
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.ar.core.*
import com.google.ar.core.exceptions.*
import java.util.concurrent.atomic.AtomicReference

/**
 * ASORIA ARCore Native Module
 * Exposes ARCore capabilities to React Native for room scanning
 */
class ARCoreModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "ARCoreModule"
        const val NAME = "ARCoreModule"
        const val GRID_SIZE_METERS = 0.05 // 5cm grid snapping
    }

    private var session: Session? = null
    private var frame: Frame? = null
    private val config = AtomicReference<Config>()
    private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())

    override fun getName(): String = NAME

    // ── Support Check ──────────────────────────────────────────────────────────

    @ReactMethod
    fun checkSupport(promise: Promise) {
        try {
            val context = reactApplicationContext
            val availability = ArCoreApk.getInstance().checkAvailability(context)

            val hasARCore = availability.isSupported || availability.isTransient
            val hasDepthAPI = hasDepthAPI(context)

            val result = Arguments.createMap().apply {
                putBoolean("hasARCore", hasARCore)
                putBoolean("hasDepthAPI", hasDepthAPI)
                putString("availability", availability.name)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking ARCore support", e)
            promise.resolve(Arguments.createMap().apply {
                putBoolean("hasARCore", false)
                putBoolean("hasDepthAPI", false)
                putString("error", e.message)
            })
        }
    }

    private fun hasDepthAPI(context: Context): Boolean {
        return try {
            Session(context, Config())
            val capabilities = CameraConfigFilter(context).depthSensorUsage
            capabilities.contains(CameraConfig.DepthSensorUsage.REQUIRE_AND_USE)
        } catch (e: Exception) {
            false
        }
    }

    @ReactMethod
    fun requestInstall(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }

        try {
            when (ArCoreApk.getInstance().requestInstall(activity, true)) {
                ArCoreApk.InstallStatus.INSTALL_REQUESTED -> {
                    promise.resolve(Arguments.createMap().apply {
                        putBoolean("installRequested", true)
                    })
                }
                ArCoreApk.InstallStatus.INSTALLED -> {
                    promise.resolve(Arguments.createMap().apply {
                        putBoolean("alreadyInstalled", true)
                    })
                }
            }
        } catch (e: UnavailableUserDeclinedInstallationException) {
            promise.reject("USER_DECLINED", "User declined ARCore installation")
        } catch (e: Exception) {
            promise.reject("INSTALL_ERROR", e.message)
        }
    }

    // ── Session Lifecycle ──────────────────────────────────────────────────────

    @ReactMethod
    fun startSession(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }

        try {
            // Create session if not exists
            if (session == null) {
                session = Session(activity, Config().apply {
                    planeFindingMode = Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL
                    depthMode = if (hasDepthAPI(activity)) Config.DepthMode.AUTOMATIC else Config.DepthMode.DISABLED
                    updateMode = Config.UpdateMode.LATEST_CAMERA_IMAGE
                    lightEstimationMode = Config.LightEstimationMode.ENVIRONMENTAL_HDR
                })
            }

            // Resume session
            session?.resume()

            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putBoolean("depthEnabled", hasDepthAPI(activity))
            })
        } catch (e: UnavailableArcoreNotInstalledException) {
            promise.reject("ARCORE_NOT_INSTALLED", "ARCore is not installed")
        } catch (e: UnavailableApkTooOldException) {
            promise.reject("ARCORE_TOO_OLD", "ARCore needs to be updated")
        } catch (e: UnavailableSdkTooOldException) {
            promise.reject("SDK_TOO_OLD", "ARCore SDK is too old")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting ARCore session", e)
            promise.reject("SESSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopSession(promise: Promise) {
        try {
            session?.pause()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping ARCore session", e)
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun updateFrame(promise: Promise) {
        try {
            val currentSession = session ?: run {
                promise.reject("NO_SESSION", "No active session")
                return
            }

            frame = currentSession.update()

            // Emit plane detection events
            val planes = frame?.getUpdatedTrackables(Plane::class.java)
            if (planes != null && planes.isNotEmpty()) {
                emitPlanesDetected(planes)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error updating frame", e)
            promise.reject("UPDATE_ERROR", e.message)
        }
    }

    // ── Hit Testing ────────────────────────────────────────────────────────────

    @ReactMethod
    fun hitTest(x: Float, y: Float, promise: Promise) {
        try {
            val currentFrame = frame ?: run {
                promise.reject("NO_FRAME", "No frame available")
                return
            }

            val hits = currentFrame.hitTest(x, y)
            val hit = hits.firstOrNull { it.distance > 0 } ?: run {
                promise.resolve(null)
                return
            }

            val pose = hit.hitPose
            val point = Arguments.createMap().apply {
                putDouble("x", snapToGrid(pose.tx()))
                putDouble("y", snapToGrid(pose.ty()))
                putDouble("z", snapToGrid(pose.tz()))
            }
            promise.resolve(point)
        } catch (e: Exception) {
            Log.e(TAG, "Error in hit test", e)
            promise.reject("HIT_TEST_ERROR", e.message)
        }
    }

    // ── Plane Detection ──────────────────────────────────────────────────────────

    @ReactMethod
    fun getDetectedPlanes(promise: Promise) {
        try {
            val currentFrame = frame ?: run {
                promise.resolve(Arguments.createArray())
                return
            }

            val planes = currentFrame.getUpdatedTrackables(Plane::class.java)
            val result = Arguments.createArray()

            for (plane in planes) {
                if (plane.trackingState != TrackingState.TRACKING) continue

                val planeMap = Arguments.createMap().apply {
                    putString("id", plane.hashCode().toString())
                    putString("type", when {
                        plane.type == Plane.Type.HORIZONTAL_UPWARD_FACING -> "floor"
                        plane.type == Plane.Type.HORIZONTAL_DOWNWARD_FACING -> "ceiling"
                        plane.type == Plane.Type.VERTICAL -> "wall"
                        else -> "unknown"
                    })
                    putDouble("centerX", snapToGrid(plane.centerPose.tx()))
                    putDouble("centerY", snapToGrid(plane.centerPose.ty()))
                    putDouble("centerZ", snapToGrid(plane.centerPose.tz()))
                    putDouble("extentX", snapToGrid(plane.extentX))
                    putDouble("extentZ", snapToGrid(plane.extentZ))
                    putDouble("confidence", plane.subsumedBy?.let { 0.5 } ?: 1.0)
                }
                result.pushMap(planeMap)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting detected planes", e)
            promise.reject("PLANES_ERROR", e.message)
        }
    }

    // ── Distance Calculation ───────────────────────────────────────────────────

    @ReactMethod
    fun distanceBetween(p1: ReadableMap, p2: ReadableMap, promise: Promise) {
        try {
            val x1 = p1.getDouble("x")
            val y1 = p1.getDouble("y")
            val z1 = p1.getDouble("z")
            val x2 = p2.getDouble("x")
            val y2 = p2.getDouble("y")
            val z2 = p2.getDouble("z")

            val distance = Math.sqrt(
                Math.pow(x2 - x1, 2.0) +
                Math.pow(y2 - y1, 2.0) +
                Math.pow(z2 - z1, 2.0)
            )

            promise.resolve(snapToGrid(distance))
        } catch (e: Exception) {
            Log.e(TAG, "Error calculating distance", e)
            promise.reject("DISTANCE_ERROR", e.message)
        }
    }

    // ── Camera Pose ────────────────────────────────────────────────────────────

    @ReactMethod
    fun getCameraPose(promise: Promise) {
        try {
            val currentFrame = frame ?: run {
                promise.reject("NO_FRAME", "No frame available")
                return
            }

            val pose = currentFrame.camera.pose
            val result = Arguments.createMap().apply {
                putDouble("x", snapToGrid(pose.tx()))
                putDouble("y", snapToGrid(pose.ty()))
                putDouble("z", snapToGrid(pose.tz()))
                putDouble("qx", pose.qx().toDouble())
                putDouble("qy", pose.qy().toDouble())
                putDouble("qz", pose.qz().toDouble())
                putDouble("qw", pose.qw().toDouble())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting camera pose", e)
            promise.reject("POSE_ERROR", e.message)
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private fun snapToGrid(value: Double): Double {
        return Math.round(value / GRID_SIZE_METERS) * GRID_SIZE_METERS
    }

    private fun snapToGrid(value: Float): Double {
        return snapToGrid(value.toDouble())
    }

    private fun emitPlanesDetected(planes: Collection<Plane>) {
        val params = Arguments.createMap().apply {
            putInt("count", planes.size)
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("ARCorePlanesDetected", params)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            session?.close()
            session = null
        } catch (e: Exception) {
            Log.e(TAG, "Error closing session", e)
        }
    }
}
