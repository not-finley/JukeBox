
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ca.jukeboxd.app',
  appName: 'Jukeboxd',
  webDir: 'dist',
  server: {
    url: 'http://10.0.0.205:3000', 
    cleartext: true
  }
};

export default config;