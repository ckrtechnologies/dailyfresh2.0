# React Native — JS Boilerplate & CLI Command Reference
> Argosmob Tech and AI Pvt Ltd — Internal Dev Reference
> **RN 0.85.2 | JavaScript (No TypeScript) | Stable Configuration**

---

## STEP 1 — Create Project

```bash
npx @react-native-community/cli@latest init ProjectName --version 0.85.2 --skip-install
```

> Use PascalCase for project name. e.g. `DoctorApp`, `GreenHealth`

---

## STEP 2 — Navigate into Project

```bash
cd ProjectName
```

---

## STEP 3 — Delete TypeScript config (we use JS)

```bash
# Windows CMD
del tsconfig.json

# Mac / Linux
rm tsconfig.json
```

---

## STEP 4 — Set Exact Versions in package.json

Replace the `dependencies` and `devDependencies` in your `package.json` with the following:

```json
{
  "dependencies": {
    "react": "19.2.3",
    "react-native": "0.85.2",
    "@react-native-async-storage/async-storage": "1.21.0",
    "@react-navigation/native": "7.2.2",
    "@react-navigation/stack": "7.8.10",
    "@react-navigation/bottom-tabs": "7.15.9",
    "react-native-screens": "4.24.0",
    "react-native-safe-area-context": "5.7.0",
    "react-native-gesture-handler": "2.31.1",
    "react-native-vector-icons": "10.3.0",
    "axios": "1.15.2",
    "react-native-config": "1.6.1",
    "socket.io-client": "4.8.3",
    "react-redux": "9.2.0",
    "@reduxjs/toolkit": "2.11.2"
  },
  "devDependencies": {
    "@babel/core": "7.25.2",
    "@babel/preset-env": "7.25.3",
    "@babel/runtime": "7.25.0",
    "@react-native/babel-preset": "0.85.2",
    "@react-native/eslint-config": "0.85.2",
    "@react-native/metro-config": "0.85.2"
  }
}
```

> [!IMPORTANT]
> **AsyncStorage v1.21.0** is the stable target. Version 3.x+ has known issues with internal dependency resolution (org.asyncstorage.shared_storage) on Android.

---

## STEP 5 — Create .npmrc (lock exact versions)

```bash
# Windows CMD
echo save-exact=true > .npmrc

# Mac / Linux
echo "save-exact=true" > .npmrc
```

---

## STEP 5.5 — Android Build Fix (JitPack)

If you face build errors related to `org.asyncstorage.shared_storage` or other missing native artifacts, add this to `android/build.gradle`:

```gradle
allprojects {
    repositories {
        maven { url 'https://www.jitpack.io' }
        google()
        mavenCentral()
    }
}
```

---

## STEP 6 — Install Dependencies

```bash
npm install
```

---

## STEP 7 — Install iOS Pods (Mac only)

```bash
cd ios && pod install && cd ..
```

---

## STEP 8 — Update babel.config.js

Open `babel.config.js` and replace everything with:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
};
```

> ⚠️ `react-native-reanimated/plugin` must always be the LAST plugin

---

## STEP 9 — Setup Folder Structure

Run all at once:

```bash
mkdir src
mkdir src/screens
mkdir src/components
mkdir src/navigation
mkdir src/hooks
mkdir src/utils
mkdir src/assets
mkdir src/assets/images
mkdir src/assets/fonts
mkdir src/api
mkdir src/constants
```

**Windows CMD equivalent:**
```cmd
mkdir src && mkdir src\screens && mkdir src\components && mkdir src\navigation && mkdir src\hooks && mkdir src\utils && mkdir src\assets && mkdir src\assets\images && mkdir src\assets\fonts && mkdir src\api && mkdir src\constants
```

---

## STEP 10 — Create Core Files

### App.js (root)

```bash
# Mac / Linux
cat > App.js << 'EOF'
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
EOF
```

**Windows — create manually** `App.js`:
```js
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
```

---

### src/navigation/RootNavigator.js

```js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
```

---

### src/screens/HomeScreen.js

```js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
```

---

### src/api/client.js

```js
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://your-api-url.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
client.interceptors.request.use(
  config => {
    // attach token here if needed
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor
client.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error),
);

export default client;
```

---

### src/constants/colors.js

```js
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  text: '#000000',
  textLight: '#8E8E93',
  border: '#C6C6C8',
  error: '#FF3B30',
  success: '#34C759',
};
```

---

### src/constants/config.js

```js
export const CONFIG = {
  API_URL: 'https://your-api-url.com/api',
  CLOUDINARY_CLOUD_NAME: 'your_cloud_name',
  CASHFREE_ENV: 'TEST', // 'TEST' or 'PROD'
};
```

---

## STEP 11 — Run the App

**Android:**
```bash
npx react-native run-android
```

**iOS (Mac only):**
```bash
npx react-native run-ios
```

**Start Metro bundler separately:**
```bash
npx react-native start
```

**Start Metro with cache reset:**
```bash
npx react-native start --reset-cache
```

---

## Clean Build Commands

**Android clean:**
```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

**Android clean (Windows):**
```cmd
cd android && gradlew clean && cd ..
npx react-native run-android
```

**iOS clean (Mac):**
```bash
cd ios && pod deintegrate && pod install && cd ..
npx react-native run-ios
```

---

## Remove & Reinstall node_modules

**Mac / Linux:**
```bash
rm -rf node_modules && npm ci
```

**Windows CMD:**
```cmd
rmdir /s /q node_modules && npm ci
```

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules; npm ci
```

---

## Useful Debug Commands

```bash
# Check RN environment
npx react-native doctor

# Check connected Android devices
adb devices

# Clear Android ADB
adb kill-server && adb start-server

# View Android logs
adb logcat *:E

# View Metro logs with verbose
npx react-native start --verbose
```

---

## Final Folder Structure

```
ProjectName/
├── android/
├── ios/
├── src/
│   ├── api/
│   │   └── client.js
│   ├── assets/
│   │   ├── fonts/
│   │   └── images/
│   ├── components/
│   ├── constants/
│   │   ├── colors.js
│   │   └── config.js
│   ├── hooks/
│   ├── navigation/
│   │   └── RootNavigator.js
│   ├── screens/
│   │   └── HomeScreen.js
│   └── utils/
├── App.js
├── babel.config.js
├── .npmrc
└── package.json
```

---

## Quick Sanity Check Before Starting

```bash
node -v          # 18.x or 20.x
java -version    # 17.x
npx react-native --version  # 0.83.1
npx react-native --version  # 0.85.2
adb devices      # Android device/emulator visible
```

---

*Last updated: April 2026 | RN 0.85.2 | JS | Stable Configuration | Argosmob Tech and AI Pvt Ltd*