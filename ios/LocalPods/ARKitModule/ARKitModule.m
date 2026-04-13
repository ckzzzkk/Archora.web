#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

/// ARKitModule Objective-C Bridge
/// Exposes the Swift ARKitModule to React Native via RCTEventEmitter + RCTBridgeModule.
/// This file handles the React Native side of the module registration.

@interface RCT_EXTERN_MODULE(ARKitModule, RCTEventEmitter)

RCT_EXTERN_METHOD(checkSupport:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestCameraPermission:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startSession:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopSession:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateFrame:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hitTest:(nonnull NSNumber *)x
                  y:(nonnull NSNumber *)y
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getDetectedPlanes:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(distanceBetween:(NSDictionary *)p1
                  p2:(NSDictionary *)p2
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCameraPose:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getMeshVertices:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
