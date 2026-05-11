# iOS Setup and Build Guide: DailyFresh Customer App

This document provides a step-by-step guide to setting up, building, and running the iOS version of the DailyFresh Customer Application.

---

## 1. Prerequisites

Ensure you have the following installed on your macOS machine:
- **Xcode**: Latest version from the App Store.
- **Node.js**: Version >= 22.11.0 (as specified in `package.json`).
- **CocoaPods**: Install via `sudo gem install cocoapods` or `brew install cocoapods`.
- **Command Line Tools**: Installed via `xcode-select --install`.

---

## 2. Initial Setup

### Step 2.1: Install Node Modules
Run the following command in the `customerapp` directory:
```bash
npm install
```

### Step 2.2: Install CocoaPods
Navigate to the `ios` directory and install the native dependencies:
```bash
cd ios
bundle install # If Gemfile exists
bundle exec pod install
cd ..
```

---

## 3. Firebase Configuration (Critical)

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Add an **iOS App** to the project. Use the bundle ID found in `Info.plist` (likely `com.dailyfreshkolkata`).
4. Download the `GoogleService-Info.plist` file.
5. **Important**: Open `ios/customerapp.xcworkspace` in Xcode.
6. Right-click on the `customerapp` folder in the project navigator and select **"Add Files to 'customerapp'..."**.
7. Select the `GoogleService-Info.plist` you downloaded. **Ensure "Copy items if needed" is checked.**

---

## 4. Required Code Changes

### Step 4.1: Initialize Firebase in `AppDelegate.swift`
Update `ios/customerapp/AppDelegate.swift` to initialize Firebase:

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase // <--- Add this

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  // ...
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure() // <--- Add this
    // ... rest of the code
  }
}
```

### Step 4.2: Update `Info.plist` Permissions
Ensure `Info.plist` has descriptions for the permissions used (Location, Camera, etc.):

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>DailyFresh needs your location to provide accurate delivery slots and find nearby stores.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>DailyFresh needs your location to provide accurate delivery updates.</string>
```

### Step 4.3: Configure Vector Icons
To use `react-native-vector-icons`, add the following to `Info.plist`:

```xml
<key>UIAppFonts</key>
<array>
  <string>AntDesign.ttf</string>
  <string>Entypo.ttf</string>
  <string>EvilIcons.ttf</string>
  <string>Feather.ttf</string>
  <string>FontAwesome.ttf</string>
  <string>FontAwesome5_Brands.ttf</string>
  <string>FontAwesome5_Regular.ttf</string>
  <string>FontAwesome5_Solid.ttf</string>
  <string>Foundation.ttf</string>
  <string>Ionicons.ttf</string>
  <string>MaterialIcons.ttf</string>
  <string>MaterialCommunityIcons.ttf</string>
  <string>SimpleLineIcons.ttf</string>
  <string>Octicons.ttf</string>
  <string>Zocial.ttf</string>
  <string>Fontisto.ttf</string>
</array>
```

---

## 5. Running the App

### Via Command Line
To run on the iOS Simulator:
```bash
npx react-native run-ios
```
To run on a specific simulator:
```bash
npx react-native run-ios --simulator="iPhone 15 Pro"
```

### Via Xcode (Recommended for Debugging)
1. Open `ios/customerapp.xcworkspace` in Xcode.
2. Select your target device/simulator at the top.
3. Press the **Play (Run)** button.

---

## 6. Troubleshooting

- **Pod Install Errors**: Run `pod repo update` and try again. If it fails, delete the `Pods` folder and `Podfile.lock` and run `pod install` again.
- **Build Errors related to Header Files**: Ensure you are opening the `.xcworkspace` file, NOT the `.xcodeproj` file.
- **Firebase Errors**: Ensure `GoogleService-Info.plist` is added correctly in Xcode and `FirebaseApp.configure()` is called.
- **Razorpay Build Issues**: If you face "Undefined symbol" errors, you may need to add `-ObjC` to **Other Linker Flags** in Xcode Build Settings.
