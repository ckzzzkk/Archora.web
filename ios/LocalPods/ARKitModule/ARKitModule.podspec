#
#  ARKitModule.podspec
#  ARKitModule
#
#  Native iOS module for ASORIA — exposes ARKit world tracking, plane detection,
#  hit testing, and camera pose to React Native via the legacy bridge (RCTEventEmitter).
#

Pod::Spec.new do |s|
  s.name             = 'ARKitModule'
  s.version          = '1.0.0'
  s.summary          = 'ARKit Native Module for ASORIA AR room scanning'
  s.description      = <<-DESC
    Exposes ARKit session management, plane detection (floor/wall/ceiling),
    raycast hit testing, and camera pose to React Native via TurboModules.
    Mirrors the Android ARCoreModule API surface.
  DESC
  s.homepage         = 'https://asoria.app'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'ASORIA' => 'dev@asoria.app' }
  s.source           = { :path => '.' }

  s.platform         = :ios, '15.0'
  s.swift_version    = '5.0'

  s.source_files     = '*.{swift,m,mm,h}'
  s.public_header_files = '*.h'

  s.frameworks       = 'ARKit', 'RealityKit', 'Metal', 'MetalKit'

  # TurboModule dependencies
  s.dependency       'React-Core'
  s.dependency       'React-RCTAppDelegate'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }
end
