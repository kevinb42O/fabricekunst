import React, { useEffect, useState } from 'react';
import { Check, Image as ImageIcon, RefreshCw, Save, Upload } from 'lucide-react';
import { DEFAULT_HERO_IMAGE, DEFAULT_MOBILE_HERO_IMAGE, uploadCatalogImage } from '../../utils/storage';

export default function HeroSlidesManager({
  heroImage = '',
  mobileHeroImage = '',
  onSaveHeroImage,
  onSaveMobileHeroImage,
  onShowToast = () => {}
}) {
  const [imageUrl, setImageUrl] = useState(heroImage || DEFAULT_HERO_IMAGE);
  const [mobileImageUrl, setMobileImageUrl] = useState(mobileHeroImage || DEFAULT_MOBILE_HERO_IMAGE);
  const [uploadingTarget, setUploadingTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const saveDesktopImage = onSaveHeroImage || (() => Promise.resolve());
  const saveMobileImage = onSaveMobileHeroImage || (() => Promise.resolve());

  useEffect(() => {
    setImageUrl(heroImage || DEFAULT_HERO_IMAGE);
  }, [heroImage]);

  useEffect(() => {
    setMobileImageUrl(mobileHeroImage || DEFAULT_MOBILE_HERO_IMAGE);
  }, [mobileHeroImage]);

  const handleImageUpload = async (event, target) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingTarget(target);
    try {
      const publicUrl = await uploadCatalogImage(file, {
        purpose: target === 'desktop' ? 'home-hero' : 'mobile-hero'
      });
      if (!publicUrl) throw new Error('Upload leverde geen URL op.');
      if (target === 'desktop') setImageUrl(publicUrl);
      else setMobileImageUrl(publicUrl);
      onShowToast(`${target === 'desktop' ? 'Desktop' : 'Mobiele'} afbeelding is geüpload.`, 'info');
    } catch (error) {
      console.error('Hero image upload failed:', error);
      onShowToast('Uploaden mislukt. Probeer een andere afbeelding.', 'error');
    } finally {
      setUploadingTarget(null);
      event.target.value = '';
    }
  };

  const handleReset = (target) => {
    const label = target === 'desktop' ? 'desktopafbeelding' : 'mobiele afbeelding';
    if (!window.confirm(`De standaard ${label} herstellen?`)) return;
    if (target === 'desktop') setImageUrl(DEFAULT_HERO_IMAGE);
    else setMobileImageUrl(DEFAULT_MOBILE_HERO_IMAGE);
    onShowToast(`De standaard ${label} staat klaar. Klik op opslaan om te bevestigen.`, 'info');
  };

  const handleSave = async () => {
    if (uploadingTarget) {
      onShowToast('Wacht tot de afbeelding volledig is geüpload.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await Promise.all([
        saveDesktopImage(imageUrl),
        saveMobileImage(mobileImageUrl)
      ]);
      setIsSaved(true);
      onShowToast('Beide hero-afbeeldingen zijn opgeslagen.');
      window.setTimeout(() => setIsSaved(false), 2200);
    } catch (error) {
      console.error('Hero save failed:', error);
      onShowToast('De hero-afbeeldingen konden niet worden opgeslagen.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const panels = [
    {
      id: 'desktop',
      eyebrow: 'Desktop · vanaf 1024 px',
      title: 'Brede hero-afbeelding',
      description: 'Gebruik een rustig beeld met voldoende vrije ruimte voor de tekst. Aanbevolen: 1920 × 1080 px.',
      value: imageUrl,
      setValue: setImageUrl,
      aspectClass: 'admin-hero-preview--desktop'
    },
    {
      id: 'mobile',
      eyebrow: 'Mobiel · tot 1023 px',
      title: 'Staande hero-afbeelding',
      description: 'Deze afbeelding staat volledig los van desktop. Aanbevolen verhouding: 3:4 of 4:5.',
      value: mobileImageUrl,
      setValue: setMobileImageUrl,
      aspectClass: 'admin-hero-preview--mobile'
    }
  ];

  return (
    <div className="admin-module admin-hero-manager">
      <section className="admin-module-heading">
        <div>
          <p className="admin-eyebrow">Homepage</p>
          <h1>Hero-afbeeldingen</h1>
          <p>Beheer de desktop- en mobiele presentatie onafhankelijk van elkaar.</p>
        </div>
        <button type="button" className="admin-button admin-button--primary" onClick={handleSave} disabled={isSaving || Boolean(uploadingTarget)}>
          {isSaved ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}
          {isSaving ? 'Opslaan…' : isSaved ? 'Opgeslagen' : 'Wijzigingen opslaan'}
        </button>
      </section>

      <div className="admin-hero-grid">
        {panels.map((panel) => (
          <section className="admin-hero-card" key={panel.id} aria-labelledby={`${panel.id}-hero-title`}>
            <div className="admin-hero-card__header">
              <div>
                <p className="admin-eyebrow">{panel.eyebrow}</p>
                <h2 id={`${panel.id}-hero-title`}>{panel.title}</h2>
                <p>{panel.description}</p>
              </div>
              <button type="button" className="admin-icon-button" onClick={() => handleReset(panel.id)} title="Standaard herstellen" aria-label={`${panel.title} herstellen`}>
                <RefreshCw aria-hidden="true" />
              </button>
            </div>

            <div className={`admin-hero-preview ${panel.aspectClass}`}>
              {panel.value ? <img src={panel.value} alt={`${panel.title} voorbeeld`} /> : <ImageIcon aria-hidden="true" />}
              <span>Voorbeeld</span>
            </div>

            <label className="admin-upload-control">
              <Upload aria-hidden="true" />
              <span>
                <strong>{uploadingTarget === panel.id ? 'Uploaden…' : 'Afbeelding vervangen'}</strong>
                <small>JPG, PNG of WebP</small>
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={isSaving || Boolean(uploadingTarget)} onChange={(event) => handleImageUpload(event, panel.id)} />
            </label>

            <label className="admin-field">
              <span>Afbeeldings-URL</span>
              <input type="url" value={panel.value} onChange={(event) => panel.setValue(event.target.value)} placeholder="/images/hero.jpg" />
            </label>
          </section>
        ))}
      </div>
    </div>
  );
}
