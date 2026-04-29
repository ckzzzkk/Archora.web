//
//  ARKitModule.swift
//  ARKitModule
//
//  ARKit native module for ASORIA — mirrors ARCoreModule.kt API surface.
//  Uses RCTEventEmitter (legacy bridge) for NativeEventEmitter compatibility.
//

import Foundation
import ARKit
import RealityKit
import simd

@objc(ARKitModule)
class ARKitModule: RCTEventEmitter {

  // MARK: - Constants

  /// 5 cm grid snapping — matches GRID_SIZE_METERS in ARCoreModule.kt
  private let gridSizeMeters: Float = 0.05

  // MARK: - State

  private var session: ARSession?
  private var latestFrame: ARFrame?
  private var hasListeners = false
  private var sessionWasRunning = false

  // MARK: - RCTEventEmitter

  override static func requiresMainQueueSetup() -> Bool {
    return true // ARSession must run on main thread
  }

  override func supportedEvents() -> [String] {
    return [
      "ARKitPlanesDetected",
      "ARKitSessionInterrupted",
      "ARKitSessionResumed",
      "ARKitMeshUpdated"
    ]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  override func name() -> String! {
    return "ARKitModule"
  }

  // MARK: - Support Check

  @objc
  func checkSupport(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    let hasARKit = ARWorldTrackingConfiguration.isSupported
    let hasLiDAR = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)
    var hasDepthAPI = false

    if hasARKit {
      let config = ARWorldTrackingConfiguration()
      config.planeDetection = []
      hasDepthAPI = ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)
    }

    let result: [String: Any] = [
      "hasARCore": hasARKit, // Reuse field name from ARCoreModule for JS compatibility
      "hasDepthAPI": hasDepthAPI,
      "hasLiDAR": hasLiDAR,
      "availability": hasARKit ? "SUPPORTED" : "UNSUPPORTED",
      "deviceModel": UIDevice.current.model
    ]
    resolve(result)
  }

  // MARK: - Camera Permission (iOS-specific)

  @objc
  func requestCameraPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .video) { granted in
      resolve(["granted": granted])
    }
  }

  // MARK: - Session Lifecycle

  @objc
  func startSession(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard ARWorldTrackingConfiguration.isSupported else {
      reject("ARKIT_UNSUPPORTED", "ARKit is not supported on this device", nil)
      return
    }

    let config = ARWorldTrackingConfiguration()
    config.planeDetection = [.horizontal, .vertical]
    config.environmentTexturing = .automatic

    // Enable depth if available (LiDAR / depth camera)
    if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
      config.frameSemantics.insert(.sceneDepth)
    }

    // Enable mesh reconstruction if device supports it
    if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
      config.sceneReconstruction = .mesh
    }

    session = ARSession()
    session?.delegate = self
    session?.run(config)

    let depthEnabled = ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)
    let lidarEnabled = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)

    resolve([
      "success": true,
      "depthEnabled": depthEnabled,
      "lidarEnabled": lidarEnabled
    ])
  }

  @objc
  func stopSession(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    session?.pause()
    resolve(true)
  }

  // MARK: - Frame Update (called from JS on a ~100ms interval)

  @objc
  func updateFrame(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let frame = session?.currentFrame else {
      resolve(false)
      return
    }

    latestFrame = frame

    let planes = frame.anchors.compactMap { $0 as? ARPlaneAnchor }
    if !planes.isEmpty && hasListeners {
      sendEvent(withName: "ARKitPlanesDetected", body: ["count": planes.count])
    }

    resolve(true)
  }

  // MARK: - Hit Test

  @objc
  func hitTest(_ x: NSNumber, y: NSNumber,
              resolver resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let frame = latestFrame ?? session?.currentFrame else {
      resolve(NSNull())
      return
    }

    let screenPoint = CGPoint(x: x.doubleValue, y: y.doubleValue)

    // 1. Try raycast (iOS 11.3+, preferred) — works with detected planes
    if let query = frame.raycastQuery(from: screenPoint, allowing: .estimatedPlane, alignment: .any),
       let result = session?.raycast(query).first {
      let transform = result.worldTransform
      let pos = simd_float4(
        snapToGrid(transform.columns.3.x),
        snapToGrid(transform.columns.3.y),
        snapToGrid(transform.columns.3.z),
        1
      )
      resolve(["x": Double(pos.x), "y": Double(pos.y), "z": Double(pos.z)])
      return
    }

    // 2. Fallback: ARFrame hitTest (feature points)
    let hitResults = frame.hitTest(screenPoint, types: [.featurePoint, .estimatedHorizontalPlane, .estimatedVerticalPlane])

    if let hit = hitResults.first {
      let transform = hit.worldTransform
      let pos = simd_float4(
        snapToGrid(transform.columns.3.x),
        snapToGrid(transform.columns.3.y),
        snapToGrid(transform.columns.3.z),
        1
      )
      resolve(["x": Double(pos.x), "y": Double(pos.y), "z": Double(pos.z)])
      return
    }

    resolve(NSNull())
  }

  // MARK: - Detected Planes

  @objc
  func getDetectedPlanes(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let frame = latestFrame ?? session?.currentFrame else {
      resolve([])
      return
    }

    let planeAnchors = frame.anchors.compactMap { $0 as? ARPlaneAnchor }
    var result: [[String: Any]] = []

    for anchor in planeAnchors {
      guard anchor.isTracked else { continue }

      let planeType: String
      switch anchor.alignment {
      case .horizontal:
        // Y > 0.5m → ceiling, Y < 0.5m → floor (ARKit has no semantic classification)
        planeType = anchor.transform.columns.3.y > 0.5 ? "ceiling" : "floor"
      case .vertical:
        planeType = "wall"
      @unknown default:
        planeType = "unknown"
      }

      result.append([
        "id": anchor.identifier.uuidString,
        "type": planeType,
        "centerX": Double(snapToGrid(anchor.center.x)),
        "centerY": Double(snapToGrid(anchor.center.y)),
        "centerZ": Double(snapToGrid(anchor.transform.columns.3.z)),
        "extentX": Double(snapToGrid(anchor.planeExtent.width)),
        "extentZ": Double(snapToGrid(anchor.planeExtent.height)),
        "confidence": 1.0
      ])
    }

    resolve(result)
  }

  // MARK: - Distance Between Two Points

  @objc
  func distanceBetween(_ p1: NSDictionary, p2: NSDictionary,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let x1 = p1["x"] as? NSNumber,
          let y1 = p1["y"] as? NSNumber,
          let z1 = p1["z"] as? NSNumber,
          let x2 = p2["x"] as? NSNumber,
          let y2 = p2["y"] as? NSNumber,
          let z2 = p2["z"] as? NSNumber else {
      reject("INVALID_PARAMS", "Points must have x, y, z fields", nil)
      return
    }

    let dx = x2.floatValue - x1.floatValue
    let dy = y2.floatValue - y1.floatValue
    let dz = z2.floatValue - z1.floatValue
    let distance = sqrt(dx*dx + dy*dy + dz*dz)

    resolve(Double(snapToGrid(distance)))
  }

  // MARK: - Camera Pose

  @objc
  func getCameraPose(_ resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let frame = latestFrame ?? session?.currentFrame else {
      reject("NO_FRAME", "No ARFrame available", nil)
      return
    }

    let camera = frame.camera
    let transform = camera.transform

    let tx = transform.columns.3.x
    let ty = transform.columns.3.y
    let tz = transform.columns.3.z

    // Extract quaternion from rotation matrix (simd native conversion)
    let quat = simd_quatf(transform)

    resolve([
      "x": Double(snapToGrid(tx)),
      "y": Double(snapToGrid(ty)),
      "z": Double(snapToGrid(tz)),
      "qx": Double(quat.imag.x),
      "qy": Double(quat.imag.y),
      "qz": Double(quat.imag.z),
      "qw": Double(quat.real)
    ])
  }

  // MARK: - Mesh Extraction (LiDAR)

  @objc
  func getMeshVertices(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let frame = latestFrame ?? session?.currentFrame else {
      resolve([])
      return
    }

    let meshAnchors = frame.anchors.compactMap { $0 as? ARMeshAnchor }
    var vertices: [[String: Any]] = []

    for anchor in meshAnchors {
      guard anchor.isTracked else { continue }
      let geometry = anchor.geometry
      let transform = anchor.transform
      let verticesBuffer = geometry.vertices

      for i in 0..<verticesBuffer.count {
        let vertex = verticesBuffer[i]
        let simdVertex = simd_float3(vertex.position)
        let transformed = simd_mul(transform, simd_float4(simdVertex, 1))
        vertices.append([
          "x": Double(snapToGrid(transformed.x)),
          "y": Double(snapToGrid(transformed.y)),
          "z": Double(snapToGrid(transformed.z))
        ])
      }
    }

    resolve(vertices)
  }

  @objc
  func getMeshFaces(_ resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let frame = latestFrame ?? session?.currentFrame else {
      resolve([])
      return
    }

    let meshAnchors = frame.anchors.compactMap { $0 as? ARMeshAnchor }
    var faces: [[Int]] = []

    for anchor in meshAnchors {
      guard anchor.isTracked else { continue }
      let geometry = anchor.geometry
      let facesBuffer = geometry.faces

      for i in 0..<facesBuffer.count {
        let face = facesBuffer[i]
        faces.append([Int(face[0]), Int(face[1]), Int(face[2])])
      }
    }

    resolve(faces)
  }

  // MARK: - Grid Snapping

  private func snapToGrid(_ value: Float) -> Float {
    return (value / gridSizeMeters).rounded() * gridSizeMeters
  }

  private func snapToGrid(_ value: Double) -> Double {
    return (value / Double(gridSizeMeters)).rounded() * Double(gridSizeMeters)
  }

  // MARK: - Cleanup

  override func invalidate() {
    session?.pause()
    session = nil
    latestFrame = nil
    super.invalidate()
  }
}

// MARK: - ARSessionDelegate

extension ARKitModule: ARSessionDelegate {

  func session(_ session: ARSession, didFailWithError error: Error) {
    RCTLogError("[ARKitModule] ARSession failed: \(error.localizedDescription)")
    if hasListeners {
      sendEvent(withName: "ARKitSessionInterrupted", body: ["reason": error.localizedDescription])
    }
  }

  func sessionWasInterrupted(_ session: ARSession) {
    sessionWasRunning = true
    if hasListeners {
      sendEvent(withName: "ARKitSessionInterrupted", body: [:])
    }
  }

  func sessionInterruptionEnded(_ session: ARSession) {
    if hasListeners {
      sendEvent(withName: "ARKitSessionResumed", body: [:])
    }
  }

  func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
    let planeAnchors = anchors.compactMap { $0 as? ARPlaneAnchor }
    if !planeAnchors.isEmpty && hasListeners {
      sendEvent(withName: "ARKitPlanesDetected", body: ["count": planeAnchors.count])
    }

    // NEW: Scene mesh update (LiDAR devices)
    let meshAnchors = anchors.compactMap { $0 as? ARMeshAnchor }
    if !meshAnchors.isEmpty && hasListeners {
      let vertices = meshAnchors.flatMap { $0.geometry.vertices }
      let faces = meshAnchors.flatMap { $0.geometry.faces }
      let firstMesh = meshAnchors.first
      sendEvent(withName: "ARKitMeshUpdated", body: [
        "vertexCount": vertices.count,
        "faceCount": faces.count,
        "boundingBox": [
          firstMesh?.boundingVolume.min.x ?? 0,
          firstMesh?.boundingVolume.min.y ?? 0,
          firstMesh?.boundingVolume.min.z ?? 0,
          firstMesh?.boundingVolume.max.x ?? 0,
          firstMesh?.boundingVolume.max.y ?? 0,
          firstMesh?.boundingVolume.max.z ?? 0
        ]
      ])
    }
  }

  func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
    // Could emit incremental updates here if needed
  }
}
