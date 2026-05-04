//
//  ARKitModuleHostObject.mm
//  ARKitModule
//
//  TurboModule host object for ARKitModule.
//  Replaces the legacy RCTEventEmitter bridge (ARKitModule.mm).
//  Uses the new native module pattern for React Native's New Architecture.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTTurboModule.h>
#import <React/RCTJSIUtils.h>
#import <ReactCommon/RCTTurboModule.h>

using namespace facebook::react;

@interface ARKitModule : NSObject <RCTBridgeModule, RCTTurboModule>
@end

@implementation ARKitModule

RCT_EXPORT_MODULE(ARKitModule)

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return facebook::react::createTurboModule("ARKitModule", params);
}

@end