import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { EAST_CREE_AUDIO_BASE_URL } from './cree-syllabics.data';

@Injectable({ providedIn: 'root' })
export class CreeSyllabicsAudioService {
  readonly activeSound = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  private readonly document = inject(DOCUMENT);
  private audio: HTMLAudioElement | null = null;

  async play(audioKey: string): Promise<void> {
    if (!/^[a-z]+$/.test(audioKey)) return;

    this.stop();
    this.error.set(null);

    // Some embedded browsers will reject playback from a detached Audio
    // object. Keep a real media element in the document while it plays so the
    // click remains associated with the playback request.
    const audio = this.document.createElement('audio');
    audio.src = new URL(
      `${EAST_CREE_AUDIO_BASE_URL}/${audioKey}.mp3`,
      this.document.baseURI,
    ).toString();
    audio.preload = 'auto';
    audio.setAttribute('aria-hidden', 'true');
    audio.style.display = 'none';
    this.document.body?.appendChild(audio);
    this.audio = audio;
    this.activeSound.set(audioKey);

    const clearActiveSound = () => {
      if (this.audio === audio) {
        this.audio = null;
        this.activeSound.set(null);
      }
      audio.remove();
    };

    audio.addEventListener('ended', clearActiveSound, { once: true });
    audio.addEventListener(
      'error',
      () => {
        if (this.audio !== audio) return;
        clearActiveSound();
        this.error.set('Le son officiel est temporairement indisponible.');
      },
      { once: true },
    );

    try {
      audio.load();
      await audio.play();
    } catch {
      clearActiveSound();
      this.error.set('Le navigateur n’a pas pu lancer cet extrait sonore.');
    }
  }

  stop(): void {
    if (this.audio) {
      const audio = this.audio;
      audio.pause();
      audio.currentTime = 0;
      audio.remove();
      this.audio = null;
    }
    this.activeSound.set(null);
  }
}
