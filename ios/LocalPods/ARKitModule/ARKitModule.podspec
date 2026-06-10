Pod::Spec.new do |s|
  s.name         = "ARKitModule"
  s.version      = "1.0.0"
  s.summary      = "ARKit native module for ASORIA AR features"
  s.description  = "Provides ARKit world tracking, plane detection, hit testing, and measurement for ASORIA's AR room scanning and furniture placement features."
  s.homepage    = "https://asoria.app"
  s.license     = { :type => "Proprietary", :text => "Copyright 2024 ASORIA" }
  s.author      = { "ASORIA" => "dev@asoria.app" }
  s.platform    = :ios, "15.1"
  s.source      = { :path => "." }
  s.source_files = "*.{h,m,swift}"
  s.swift_version = "5.0"
  s.frameworks  = "ARKit", "SceneKit"
  s.dependency "React-Core"
end
