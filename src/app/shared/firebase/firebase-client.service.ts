import { Injectable } from '@angular/core';
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Database, getDatabase } from 'firebase/database';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseClientService {
  get isConfigured(): boolean {
    const config = environment.firebase;

    return Boolean(
      config.apiKey &&
        config.projectId &&
        config.databaseURL &&
        config.appId &&
        !String(config.apiKey).startsWith('YOUR_') &&
        !String(config.projectId).startsWith('YOUR_') &&
        !String(config.databaseURL).includes('YOUR_') &&
        !String(config.appId).startsWith('YOUR_'),
    );
  }

  get app(): FirebaseApp {
    if (!this.isConfigured) {
      throw new Error(
        'Firebase n’est pas configuré. Ajoutez les valeurs Firebase dans environment.ts.',
      );
    }

    return getApps().length ? getApp() : initializeApp(environment.firebase satisfies FirebaseOptions);
  }

  get auth(): Auth {
    return getAuth(this.app);
  }

  get database(): Database {
    return getDatabase(this.app);
  }
}
