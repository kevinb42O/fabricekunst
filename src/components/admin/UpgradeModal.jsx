import React, { useState, useEffect } from 'react';
import { X, QrCode, CreditCard, ShieldCheck, Check, Copy } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, product = 'pro' }) => {
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBillingCycle('yearly');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isPro = product === 'pro';
  const isPremium = product === 'premium';
  
  const isYearly = billingCycle === 'yearly';

  // Premium Plan variables
  const premiumPrice = isYearly ? 490 : 49;
  const premiumDesc = isYearly ? 'Totaalbedrag per jaar' : 'Totaalbedrag per maand';

  // Pro Plan variables
  const proPrice = isYearly ? 240 : 25;
  const proDesc = isYearly ? 'Totaalbedrag per jaar' : 'Totaalbedrag per maand';

  // Token Plan variables
  const isTier1 = billingCycle === 'monthly' || billingCycle === 'tier1';
  const tokenPrice = isTier1 ? 25 : 50;
  const tokenDesc = 'Eenmalige betaling';

  const price = isPremium ? premiumPrice : (isPro ? proPrice : tokenPrice);
  const description = isPremium ? premiumDesc : (isPro ? proDesc : tokenDesc);
  const productName = isPremium ? (isYearly ? 'Premium Plan Jaarlijks' : 'Premium Plan Maandelijks') : (isPro ? (isYearly ? 'Pro Plan Jaarlijks' : 'Pro Plan Maandelijks') : (isTier1 ? 'Uitbreiding 50 Kunstwerken' : 'Uitbreiding 150 Kunstwerken'));

  // EPC QR Code
  const iban = "BE43738004886701";
  const formattedIban = "BE43 7380 0488 6701";
  const name = "Kevin Bourguignon";
  const epcString = `BCD\n002\n1\nSCT\n\n${name}\n${iban}\nEUR${price}.00\n\n${productName}`;
  const paymentData = encodeURIComponent(epcString);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${paymentData}&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedIban);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const features = isPremium ? [
    { title: '500 Kunstwerken', desc: 'Maximale capaciteit voor grote collecties' },
    { title: '20 GB Database', desc: 'Ongelimiteerde ruimte voor teksten en aanvragen' },
    { title: '500 GB Media (4K)', desc: 'Opslag voor haarscherpe, high-res beelden' },
    { title: '3 TB Dataverkeer', desc: 'Wereldwijd razendsnel via Premium CDN' },
    { title: 'Priority Support', desc: 'Directe, voorrangslijnen voor al uw vragen' }
  ] : (isPro ? [
    { title: '150 Kunstwerken', desc: 'Verdrievoudig direct uw huidige capaciteit' },
    { title: '8 GB Database', desc: 'Ruim voldoende voor jaren aan data' },
    { title: '100 GB Media (4K)', desc: 'Optimale afbeeldingskwaliteit zonder compressie' },
    { title: '750 GB Dataverkeer', desc: 'Inclusief edge caching voor supersnelle laadtijden' },
    { title: 'Geavanceerde Analytics', desc: 'Inzicht in de volledige bezoekershistorie' }
  ] : (isTier1 ? [
    { title: '+50 Extra Kunstwerken', desc: 'Eenmalige toevoeging aan uw account' },
    { title: 'Geen abonnement', desc: 'Levenslang geldig zonder extra maandkosten' },
    { title: 'Direct actief', desc: 'Na betaling kunt u direct nieuwe werken uploaden' }
  ] : [
    { title: '+150 Extra Kunstwerken', desc: 'Maximale uitbreiding zonder vast contract' },
    { title: 'Beste waarde', desc: 'Laagste eenmalige prijs per kunstwerk' },
    { title: 'Direct actief', desc: 'Na betaling direct de volledige capaciteit beschikbaar' }
  ]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] w-full max-w-5xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300 border border-gray-200/50">
        
        {/* Close Button Mobile/Desktop */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 text-gray-400 hover:text-gray-900 bg-white/80 hover:bg-gray-100 rounded-full transition-colors backdrop-blur-md"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row h-full">
          
          {/* Left Column: Details & Features */}
          <div className="p-10 md:p-12 flex-1 flex flex-col bg-white">
            <h3 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              {isPremium ? 'Upgrade naar Premium' : (isPro ? 'Upgrade naar Pro' : 'Capaciteit Verhogen')}
            </h3>
            <p className="text-gray-500 mb-10 text-sm">
              {isPremium || isPro ? 'Kies uw facturatiecyclus en ontgrendel nieuwe mogelijkheden.' : 'Kies hoeveel extra capaciteit u eenmalig wilt toevoegen.'}
            </p>

            {/* Segmented Control Toggle */}
            <div className="flex p-1 bg-gray-100/60 rounded-xl mb-10 relative shadow-inner">
              {isPremium || isPro ? (
                <>
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all z-10 ${!isYearly ? 'bg-white text-gray-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Maandelijks
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all z-10 flex items-center justify-center gap-2 ${isYearly ? 'bg-white text-gray-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Jaarlijks
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-gray-900 text-white">15% Korting</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setBillingCycle('tier1')}
                    className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all z-10 ${isTier1 ? 'bg-white text-gray-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    +50 Werken
                  </button>
                  <button
                    onClick={() => setBillingCycle('tier2')}
                    className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all z-10 flex items-center justify-center gap-2 ${!isTier1 ? 'bg-white text-gray-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    +150 Werken
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-gray-900 text-white">Beste Waarde</span>
                  </button>
                </>
              )}
            </div>

            {/* Price Display */}
            <div className="mb-10 flex items-end">
              <div className="flex items-start text-gray-900 leading-none">
                <span className="text-3xl font-semibold mt-1.5 mr-1 text-gray-400">€</span>
                <span className="text-8xl font-bold tracking-tighter">{price}</span>
              </div>
              <p className="text-sm text-gray-500 ml-5 pb-2 font-medium max-w-[200px] leading-snug">{description}</p>
            </div>

            {/* Features List */}
            <div className="flex-1 mt-2">
              <ul className="space-y-5">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check size={20} className="text-gray-900 mr-4 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-base tracking-tight">{feature.title}</span>
                      <span className="text-sm text-gray-500 mt-0.5">{feature.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Payment Details */}
          <div className="bg-[#fafafa] md:w-[420px] p-10 md:p-12 flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60">
            
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 tracking-tight">Bestelling Afronden</h4>
              <p className="text-sm text-gray-500 mt-2">Scan met uw vertrouwde bank-app of betaal handmatig via overschrijving.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-gray-100 mb-10 mx-auto flex items-center justify-center w-full max-w-[280px] aspect-square">
              <img src={qrUrl} alt="Betaal QR Code" className="w-full h-full object-contain" style={{ filter: 'contrast(1.2)' }} />
            </div>
            
            <div className="w-full mt-auto">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs uppercase tracking-widest font-semibold text-gray-400">Handmatige overschrijving</span>
              </div>
              <button 
                onClick={handleCopy}
                className="w-full flex items-center justify-between bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-5 py-4 transition-all group shadow-sm hover:shadow"
              >
                <span className="font-mono text-[15px] font-semibold text-gray-900 tracking-widest">{formattedIban}</span>
                {copied ? (
                  <span className="flex items-center text-xs font-semibold text-gray-900 transition-all">
                    <Check size={16} className="mr-1.5" /> Gekopieerd
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-semibold text-gray-400 group-hover:text-gray-900 transition-all">
                    <Copy size={16} className="mr-1.5" /> Kopieer
                  </span>
                )}
              </button>
            </div>

            <div className="mt-8 flex items-center gap-6 text-xs font-medium text-gray-400 justify-center">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} />
                Veilig & Gecodeerd
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard size={16} />
                Direct Verwerkt
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
