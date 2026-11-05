import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jumpliving.proptech',
  appName: 'Jump PropTech',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;