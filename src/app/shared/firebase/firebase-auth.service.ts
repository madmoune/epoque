import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { FirebaseClientService } from './firebase-client.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly firebaseClient = inject(FirebaseClientService);
  private readonly userState = signal<User | null>(null);
  private readonly readyState = signal(false);
  private readonly busyState = signal(false);
  private readonly errorState = signal('');
  private readonly profileVersion = signal(0);
  private readonly initialization: Promise<void>;
  private auth?: Auth;

  readonly user = this.userState.asReadonly();
  readonly accountUser = computed(() => {
    const user = this.userState();
    return user && !user.isAnonymous ? user : null;
  });
  readonly accountDisplayName = computed(() => {
    this.profileVersion();
    const user = this.accountUser();

    return (
      user?.displayName ||
      user?.providerData.find((provider) => provider.displayName)?.displayName ||
      null
    );
  });
  readonly isReady = this.readyState.asReadonly();
  readonly isBusy = this.busyState.asReadonly();
  readonly errorMessage = this.errorState.asReadonly();

  constructor() {
    this.initialization = this.initialize();
  }

  get isConfigured(): boolean {
    return this.firebaseClient.isConfigured;
  }

  async ensureAuthenticated(): Promise<User> {
    if (!this.isConfigured) {
      throw new Error('Firebase n’est pas configuré.');
    }

    await this.initialization;

    const auth = this.getAuth();

    if (auth.currentUser) {
      return auth.currentUser;
    }

    await setPersistence(auth, browserSessionPersistence);

    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    const user = auth.currentUser;

    if (!user) {
      throw new Error('Impossible de démarrer la session Firebase.');
    }

    return user;
  }

  async signInWithGoogle(): Promise<User | null> {
    if (!this.isConfigured) {
      this.errorState.set('La connexion est indisponible pour le moment.');
      return null;
    }

    this.busyState.set(true);
    this.errorState.set('');

    try {
      await this.initialization;
      const auth = this.getAuth();
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      const currentUser = auth.currentUser;
      const result = currentUser?.isAnonymous
        ? await this.linkAnonymousUser(currentUser, auth, provider)
        : await signInWithPopup(auth, provider);

      const signedInUser = await this.refreshUserProfile(result.user);

      this.userState.set(signedInUser);
      return signedInUser;
    } catch (error) {
      this.errorState.set(this.describeAuthError(error));
      return null;
    } finally {
      this.busyState.set(false);
    }
  }

  async signOut(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    this.busyState.set(true);
    this.errorState.set('');

    try {
      await this.initialization;
      await firebaseSignOut(this.getAuth());
      this.userState.set(null);
    } catch (error) {
      this.errorState.set(this.describeAuthError(error));
    } finally {
      this.busyState.set(false);
    }
  }

  private async initialize(): Promise<void> {
    if (!this.isConfigured) {
      this.readyState.set(true);
      return;
    }

    try {
      const auth = this.getAuth();
      onAuthStateChanged(
        auth,
        (user) => this.userState.set(user),
        (error) => this.errorState.set(this.describeAuthError(error)),
      );

      await Promise.race([
        auth.authStateReady(),
        new Promise<void>((resolve) => globalThis.setTimeout(resolve, 5000)),
      ]);
      const currentUser = auth.currentUser;
      const refreshedUser =
        currentUser && !currentUser.isAnonymous
          ? await this.refreshUserProfile(currentUser)
          : currentUser;

      this.userState.set(refreshedUser);
      this.readyState.set(true);
    } catch (error) {
      this.readyState.set(true);
      this.errorState.set(this.describeAuthError(error));
    }
  }

  private getAuth(): Auth {
    this.auth ??= this.firebaseClient.auth;
    return this.auth;
  }

  private async refreshUserProfile(user: User): Promise<User> {
    try {
      await user.reload();
    } catch {
      // Keep the cached profile when Firebase cannot refresh it.
    } finally {
      this.profileVersion.update((version) => version + 1);
    }

    return this.getAuth().currentUser ?? user;
  }

  private async linkAnonymousUser(
    anonymousUser: User,
    auth: Auth,
    provider: GoogleAuthProvider,
  ) {
    try {
      return await linkWithPopup(anonymousUser, provider);
    } catch (error) {
      if (this.getErrorCode(error) !== 'auth/credential-already-in-use') {
        throw error;
      }

      return signInWithPopup(auth, provider);
    }
  }

  private describeAuthError(error: unknown): string {
    switch (this.getErrorCode(error)) {
      case 'auth/popup-closed-by-user':
        return 'La fenêtre de connexion a été fermée.';
      case 'auth/popup-blocked':
        return 'Le navigateur a bloqué la fenêtre de connexion.';
      case 'auth/operation-not-allowed':
        return 'La connexion Google doit être activée dans Firebase Authentication.';
      default:
        return 'La connexion Firebase est momentanément indisponible.';
    }
  }

  private getErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object' || !('code' in error)) {
      return null;
    }

    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
}
