import React, { useState } from 'react';
import { X, QrCode, CreditCard, ShieldCheck, Check, Copy } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, product = 'pro' }) => {
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isPro = product === 'pro';
  
  // Pro Plan variables
  const isYearly = billingCycle === 'yearly';
  const proPrice = isYearly ? 300 : 30;
  const proDesc = isYearly ? '€25 / maand, gefactureerd als €300 per jaar. (Incl. 150 kunstwerken limiet)' : '€30 / maand, maandelijks gefactureerd. (Incl. 150 kunstwerken limiet)';

  // Token Plan variables
  const isTier1 = billingCycle === 'monthly' || billingCycle === 'tier1';
  const tokenPrice = isTier1 ? 25 : 50;
  const tokenDesc = isTier1 ? 'Eenmalige betaling voor +50 werken' : 'Eenmalige betaling voor +150 werken';

  const price = isPro ? proPrice : tokenPrice;
  const description = isPro ? proDesc : tokenDesc;
  const productName = isPro ? (isYearly ? 'Pro Plan Jaarlijks' : 'Pro Plan Maandelijks') : (isTier1 ? 'Uitbreiding 50 Kunstwerken' : 'Uitbreiding 150 Kunstwerken');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{isPro ? 'Upgrade naar Pro' : 'Capaciteitsuitbreiding'}</h3>
            <p className="text-sm text-gray-500 mt-1">{isPro ? 'Kies uw facturatiecyclus' : 'Kies hoeveel werken u wilt toevoegen'}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8">
          
          {/* Segmented Control Toggle */}
          <div className="flex p-1 bg-gray-100/80 rounded-xl mb-8 relative">
            {isPro ? (
              <>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all z-10 ${!isYearly ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Maandelijks
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all z-10 flex items-center justify-center gap-2 ${isYearly ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Jaarlijks
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${isYearly ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>-15%</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setBillingCycle('tier1')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all z-10 ${isTier1 ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  +50 Werken
                </button>
                <button
                  onClick={() => setBillingCycle('tier2')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all z-10 flex items-center justify-center gap-2 ${!isTier1 ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  +150 Werken
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${!isTier1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>Populair</span>
                </button>
              </>
            )}
          </div>

          {/* Price Display */}
          <div className="text-center mb-8">
            <div className="flex items-start justify-center text-gray-900">
              <span className="text-2xl font-semibold mt-1 mr-1">€</span>
              <span className="text-6xl font-extrabold tracking-tighter">{price}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">{description}</p>
          </div>

          {/* Payment Section */}
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 flex flex-col items-center">
            
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
              <QrCode size={18} className="text-gray-400" />
              Scan met uw bank app
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <img src={qrUrl} alt="Betaal QR Code" className="w-40 h-40 object-contain rounded-lg" />
            </div>
            
            <div className="w-full">
              <div className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2 text-left pl-1">Of maak over naar</div>
              <button 
                onClick={handleCopy}
                className="w-full flex items-center justify-between bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-3 transition-all group shadow-sm hover:shadow"
              >
                <span className="font-mono text-sm font-semibold text-gray-900 tracking-wider">{formattedIban}</span>
                {copied ? (
                  <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md transition-all">
                    <Check size={14} className="mr-1" /> Gekopieerd
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-semibold text-gray-500 group-hover:text-gray-900 bg-gray-50 group-hover:bg-gray-100 px-2 py-1 rounded-md transition-all">
                    <Copy size={14} className="mr-1" /> Kopieer
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Trust */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs font-medium text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-green-500" />
              Veilig betalen
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard size={16} />
              Direct via uw bank
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
