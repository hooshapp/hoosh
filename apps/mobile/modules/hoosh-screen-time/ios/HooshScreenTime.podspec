Pod::Spec.new do |s|
  s.name = 'HooshScreenTime'
  s.version = '0.1.0'
  s.summary = 'Hoosh device-local authorization'
  s.description = s.summary
  s.license = 'UNLICENSED'
  s.author = 'Hoosh'
  s.homepage = 'https://developer.apple.com/documentation/familycontrols'
  s.source = { :git => '' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
