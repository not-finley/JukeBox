import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jukeboxd.app',
  appName: 'Jukeboxd',
  webDir: 'dist',
  
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      overlaysWebView: true,
    },
    AndroidEdgeToEdgeSupport: {
        adjustMarginsForEdgeToEdge: 'auto' 
    },
  },
};

export default config;