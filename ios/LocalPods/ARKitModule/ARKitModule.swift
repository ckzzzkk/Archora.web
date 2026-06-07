import Foundation
import ARKit
import SceneKit
import React

/// ASORIA ARKit Native Module
/// Exposes ARKit capabilities to React Native for room scanning, furniture placement, and measurement.
/// Mirrors the Android ARCoreModule API surface for cross-platform parity.
@objc(ARKitModule)
class ARKitModule: RCTEventEmitter {

    // ── Types ─────────────────────────────────────────────────────────────────

    struct Vector3D {
        var x: Double
        var y: Double
        var z: Double
    }

    struct DetectedPlane {
        var id: String
        var type: String      // "floor" | "wall" | "ceiling" | "unknown"
        var centerX: Double
        var centerY: Double
        var centerZ: Double
        var extentX: Double   // width in metres
        var extentZ: Double  // height in metres
        var confidence: Double
    }

    struct CameraPose {
        var x: Double
        var y: Double
        var z: Double
        var qx: Double
        var qy: Double
        var qz: Double
        var qw: Double
    }

    // ── Constants ─────────────────────────────────────────────────────────────

    private let gridSizeMeters: Double = 0.05  // 5cm grid snapping
    private let supportsLiDAR: Bool = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)

    // ── State ────────────────────────────────────────────────────────────────

    private var session: ARSession?
    private var configuration: ARWorldTrackingConfiguration?
    private var currentFrame: ARFrame?
    private var detectedPlanes: [UUID: ARPlaneAnchor] = [:]
    private var hasListeners = false

    // ── RCTEventEmitter ──────────────────────────────────────────────────────

    override static func moduleName() -> String! {
        return "ARKitModule"
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["ARKitPlanesDetected", "ARKitSessionInterrupted", "ARKitSessionResumed"]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    // ── Support Check ─────────────────────────────────────────────────────────

    @objc
    func checkSupport(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let hasARKit = ARWorldTrackingConfiguration.isSupported
            let hasLiDAR = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)
            let hasDepth  = ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)

            let result: [String: Any] = [
                "hasARCore": hasARKit,          // rename: means "ARKit available" on iOS
                "hasDepthAPI": hasDepth || hasLiDAR,
                "hasLiDAR": hasLiDAR,
                "availability": hasARKit ? "supported" : "unsupported",
                "deviceModel": UIDevice.current.model
            ]
            resolve(result)
        }
    }

    @objc
    func requestCameraPermission(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            resolve(["granted": granted])
        }
    }

    // ── Session Lifecycle ──────────────────────────────────────────────────────

    @objc
    func startSession(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            guard ARWorldTrackingConfiguration.isSupported else {
                reject("ARKIT_UNSUPPORTED", "ARKit is not supported on this device", nil)
                return
            }

            let config = ARWorldTrackingConfiguration()
            config.planeDetection = [.horizontal, .vertical]
            config.environmentTexturing = .automatic
            config.isLightEstimationEnabled = true

            // Enable LiDAR mesh if available
            if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
                config.sceneReconstruction = .mesh
            }

            // Enable depth if available
            if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
                config.frameSemantics.insert(.sceneDepth)
            }

            self.configuration = config
            self.session = ARSession()
            self.session?.delegate = self
            self.session?.run(config, options: [.resetTracking, .removeExistingAnchors])

            // Deliver initial frame synchronously
            if let frame = self.session?.currentFrame {
                self.currentFrame = frame
            }

            resolve([
                "success": true,
                "depthEnabled": config.frameSemantics.contains(.sceneDepth) || (ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)),
                "lidarEnabled": ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)
            ])
        }
    }

    @objc
    func stopSession(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            self?.session?.pause()
            self?.detectedPlanes.removeAll()
            self?.currentFrame = nil
            resolve(true)
        }
    }

    @objc
    func updateFrame(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let session = self.session else {
                reject("NO_SESSION", "No active ARKit session", nil)
                return
            }

            self.currentFrame = session.currentFrame

            // Collect updated planes
            let updatedPlanes = session.currentFrame?.anchors.compactMap { $0 as? ARPlaneAnchor }

            // Emit plane detection event if planes changed
            if self.hasListeners, let planes = updatedPlanes, !planes.isEmpty {
                let planeArray = planes.map { self.planeToDict($0) }
                self.sendEvent(withName: "ARKitPlanesDetected", body: [
                    "count": planes.count,
                    "planes": planeArray
                ])
            }

            resolve(true)
        }
    }

    // ── Hit Testing ──────────────────────────────────────────────────────────

    /// Performs a hit test at screen coordinates, intersecting with detected planes.
    /// x, y are in screen pixels (from bottom-left origin to match ARKit convention).
    @objc
    func hitTest(_ x: NSNumber, y: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let frame = self.session?.currentFrame else {
                resolve(nil)
                return
            }

            // Convert screen point to normalized coordinates (-0.5 to 0.5)
            // Using center of screen as reference for now; actual implementation
            // would use the camera view's bounds
            let screenPoint = CGPoint(x: x.doubleValue, y: y.doubleValue)

            // ARKit ray cast — most reliable method on LiDAR devices
            if let query = frame.raycastQuery(from: screenPoint, allowing: .estimatedPlane, alignment: .any) {
                let results = self.session?.raycast(query) ?? []
                if let closest = results.first {
                    let p = closest.worldTransform
                    let pos = simd_make_float3(p.columns.3)
                    resolve(self.makeVectorDict(
                        x: self.snapToGrid(Double(pos.x)),
                        y: self.snapToGrid(Double(pos.y)),
                        z: self.snapToGrid(Double(pos.z))
                    ))
                    return
                }
            }

            // Fallback: feature point hit test (slower, less accurate)
            let results = frame.hitTest(screenPoint, types: [.featurePoint, .estimatedHorizontalPlane, .estimatedVerticalPlane])
            if let hit = results.first {
                let p = hit.worldTransform
                let pos = simd_make_float3(p.columns.3)
                resolve(self.makeVectorDict(
                    x: self.snapToGrid(Double(pos.x)),
                    y: self.snapToGrid(Double(pos.y)),
                    z: self.snapToGrid(Double(pos.z))
                ))
                return
            }

            resolve(nil)
        }
    }

    // ── Plane Detection ──────────────────────────────────────────────────────

    @objc
    func getDetectedPlanes(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let frame = self.session?.currentFrame else {
                resolve([])
                return
            }

            let planeAnchors = frame.anchors.compactMap { $0 as? ARPlaneAnchor }
            let result = planeAnchors.map { self.planeToDict($0) }
            resolve(result)
        }
    }

    // ── Distance Calculation ─────────────────────────────────────────────────

    @objc
    func distanceBetween(_ p1: NSDictionary, p2: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let x1 = p1["x"] as? Double,
              let y1 = p1["y"] as? Double,
              let z1 = p1["z"] as? Double,
              let x2 = p2["x"] as? Double,
              let y2 = p2["y"] as? Double,
              let z2 = p2["z"] as? Double else {
            reject("INVALID_PARAMS", "Points must have x, y, z coordinates", nil)
            return
        }

        let distance = sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2) + pow(z2 - z1, 2))
        resolve(snapToGrid(distance))
    }

    // ── Camera Pose ──────────────────────────────────────────────────────────

    @objc
    func getCameraPose(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let frame = self.session?.currentFrame else {
                reject("NO_FRAME", "No ARKit frame available", nil)
                return
            }

            let camera = frame.camera
            let transform = camera.transform

            // Extract position from 4th column
            let tx = transform.columns.3.x
            let ty = transform.columns.3.y
            let tz = transform.columns.3.z

            // Extract rotation quaternion from camera matrix
            let q = camera.orientation(using: .current)

            resolve([
                "x":  self.snapToGrid(Double(tx)),
                "y":  self.snapToGrid(Double(ty)),
                "z":  self.snapToGrid(Double(tz)),
                "qx": Double(q.x),
                "qy": Double(q.y),
                "qz": Double(q.z),
                "qw": Double(q.w)
            ])
        }
    }

    // ── LiDAR Mesh ───────────────────────────────────────────────────────────

    @objc
    func getMeshVertices(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let frame = self.session?.currentFrame else {
                resolve([])
                return
            }

            guard ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) else {
                resolve([])
                return
            }

            var vertices: [[String: Double]] = []

            frame.anchors.forEach { anchor in
                guard let meshAnchor = anchor as? ARMeshAnchor else { return }
                let geometry = meshAnchor.geometry
                let verticesBuffer = geometry.vertices
                let transform = meshAnchor.transform

                let vertexCount = verticesBuffer.count
                for i in 0..<vertexCount {
                    let vertex = verticesBuffer[i]
                    let transformed = simd_float3(
                        simd_mul(transform, simd_float4(vertex.position, 1))
                    )
                    vertices.append([
                        "x": self.snapToGrid(Double(transformed.x)),
                        "y": self.snapToGrid(Double(transformed.y)),
                        "z": self.snapToGrid(Double(transformed.z))
                    ])
                }
            }

            resolve(vertices)
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private func snapToGrid(_ value: Double) -> Double {
        return (value / gridSizeMeters).rounded() * gridSizeMeters
    }

    private func makeVectorDict(x: Double, y: Double, z: Double) -> [String: Double] {
        return ["x": x, "y": y, "z": z]
    }

    private func planeToDict(_ plane: ARPlaneAnchor) -> [String: Any] {
        let typeString: String
        switch plane.alignment {
        case .horizontal:
            // Y > 0 → floor, Y < 0 → ceiling
            typeString = plane.transform.columns.3.y > 0 ? "floor" : "ceiling"
        case .vertical:
            typeString = "wall"
        @unknown default:
            typeString = "unknown"
        }

        return [
            "id": plane.identifier.uuidString,
            "type": typeString,
            "centerX": snapToGrid(Double(plane.center.x)),
            "centerY": snapToGrid(Double(plane.center.y)),
            "centerZ": snapToGrid(Double(plane.center.z)),
            "extentX": snapToGrid(Double(plane.extent.x)),
            "extentZ": snapToGrid(Double(plane.extent.z)),
            "confidence": Double(plane.alignment == .horizontal ? 1.0 : 0.8)
        ]
    }
}

// ── ARSessionDelegate ────────────────────────────────────────────────────────

extension ARKitModule: ARSessionDelegate {

    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        anchors.compactMap { $0 as? ARPlaneAnchor }.forEach { plane in
            detectedPlanes[plane.identifier] = plane
        }
    }

    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        anchors.compactMap { $0 as? ARPlaneAnchor }.forEach { plane in
            detectedPlanes[plane.identifier] = plane
        }
    }

    func session(_ session: ARSession, didRemove anchors: [ARAnchor]) {
        anchors.forEach { detectedPlanes.removeValue(forKey: $0.identifier) }
    }

    func sessionWasInterrupted(_ session: ARSession) {
        if hasListeners {
            sendEvent(withName: "ARKitSessionInterrupted", body: ["reason": "system"])
        }
    }

    func sessionInterruptionEnded(_ session: ARSession) {
        if hasListeners {
            sendEvent(withName: "ARKitSessionResumed", body: [:])
        }
        // Restart tracking
        if let config = configuration {
            session.run(config, options: [.resetTracking])
        }
    }
}
