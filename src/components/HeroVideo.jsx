import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './HeroVideo.css';

const LABELS = {
  nl: { video: 'Atelier Rembrandt in beeld', play: 'Video afspelen', pause: 'Video pauzeren' },
  en: { video: 'A glimpse of Atelier Rembrandt', play: 'Play video', pause: 'Pause video' },
  fr: { video: 'Atelier Rembrandt en images', play: 'Lire la vidéo', pause: 'Mettre en pause' }
};

export default function HeroVideo({ compact = false }) {
  const { language } = useLanguage();
  const labels = LABELS[language] || LABELS.nl;
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    video.defaultPlaybackRate = 0.85;
    video.playbackRate = 0.85;
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let manuallyPaused = false;
    let visible = false;
    const syncPlayback = () => {
      if (visible && !document.hidden && !preference.matches && !manuallyPaused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };
    const onPause = () => {
      // A user pause persists when the hero leaves and re-enters the viewport.
      if (visible && !document.hidden && !preference.matches) manuallyPaused = true;
    };
    const onPlay = () => { manuallyPaused = false; };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.15 });
    observer.observe(video);
    video.addEventListener('pause', onPause);
    video.addEventListener('play', onPlay);
    document.addEventListener('visibilitychange', syncPlayback);
    preference.addEventListener('change', syncPlayback);
    return () => {
      observer.disconnect();
      video.removeEventListener('pause', onPause);
      video.removeEventListener('play', onPlay);
      document.removeEventListener('visibilitychange', syncPlayback);
      preference.removeEventListener('change', syncPlayback);
      video.pause();
    };
  }, []);

  return (
    <div className={`hero-video${compact ? ' hero-video--compact' : ''}`} role="group" aria-label={labels.video}>
      <video
        ref={videoRef}
        src="/videos/atelier-rembrandt-hero.mp4"
        poster="/videos/atelier-rembrandt-hero-poster.jpg"
        width="464"
        height="832"
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={labels.video}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => { event.currentTarget.playbackRate = 0.85; }}
        onVolumeChange={(event) => {
          const video = event.currentTarget;
          if (!video.muted) video.muted = true;
          if (video.volume !== 0) video.volume = 0;
        }}
        onError={() => setFailed(true)}
      />
      {!failed && (
        <div className="hero-video__controls">
          <button
            type="button"
            aria-label={playing ? labels.pause : labels.play}
            title={playing ? labels.pause : labels.play}
            onClick={() => {
              const video = videoRef.current;
              if (video.paused) video.play().catch(() => {});
              else video.pause();
            }}
          >
            {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  );
}
