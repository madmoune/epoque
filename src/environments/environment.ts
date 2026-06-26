import { FirebaseOptions } from 'firebase/app';

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyAwNld8yTs5m087mZ5lIAP_ikzYaHMwrdo',
    authDomain: 'epoque-database.firebaseapp.com',
    databaseURL: 'https://epoque-database-default-rtdb.firebaseio.com',
    projectId: 'epoque-database',
    storageBucket: 'epoque-database.firebasestorage.app',
    messagingSenderId: '845858382820',
    appId: '1:845858382820:web:23445f074765b1eee05df1',
  } satisfies FirebaseOptions,
};
