import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mototaxi.motorista',
  appName: 'motorista-app',
  webDir: 'www',
  plugins: {
    Haptics: {
      enabled: false
    }
  }
};

export default config;
