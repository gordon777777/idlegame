import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      'phaser': '/node_modules/phaser/dist/phaser.js'
    }
  },
  server: {
    port: 3000
  }
});
