import React, { useState } from 'react';
import { Users, Search, Mail, Phone, Calendar, BookOpen, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';

export default function CustomersManager({ inquiries = [] }) {
  const [filterQuery, setFilterQuery] = useState('');

  // Group inquiries by email or name to build client list
  const customersMap = {};

  inquiries.forEach((inq) => {
    const key = (inq.email || inq.name || 'Onbekend').toLowerCase().trim();
    if (!customersMap[key]) {
      customersMap[key] = {
        id: key,
        name: inq.name || 'Anonieme verzamelaar',
        email: inq.email || '',
        phone: inq.phone || '',
        inquiries: [],
        lastContact: inq.date || 'Onbekend'
      };
    }
    customersMap[key].inquiries.push(inq);
    if (inq.phone && !customersMap[key].phone) {
      customersMap[key].phone = inq.phone;
    }
  });

  const customersList = Object.values(customersMap);

  const filteredCustomers = customersList.filter((c) => {
    const query = filterQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      c.inquiries.some(i => (i.itemTitle || '').toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 text-[#111111] animate-fade-in">
      
      {/* Header & Search */}
      <div className="p-6 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#111111] flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#B8860B]" />
            <span>Klanten & Verzamelaars Index</span>
          </h2>
          <p className="text-xs text-[#666666] mt-1">
            Overzicht van alle contacten en hun getoonde interesse in uw antiquarische boeken en kunst.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Zoek klant op naam, email, werk..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-xs text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111]"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D8CEB8] rounded-3xl space-y-3">
          <Users className="w-10 h-10 text-[#CCCCCC] mx-auto" />
          <h3 className="text-sm font-serif font-bold text-[#555555]">Geen verzamelaars gevonden</h3>
          <p className="text-xs text-[#888888]">Probeer een andere zoekterm of wacht op nieuwe binnenkomende aanvragen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((cust) => (
            <div 
              key={cust.id}
              className="p-5 rounded-3xl bg-white border border-[#D8CEB8] shadow-sm hover:shadow-md hover:border-[#111111]/30 transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Client Avatar & Name */}
                <div className="flex items-start justify-between gap-3 border-b border-[#EAE4D8] pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm shrink-0">
                      {cust.name ? cust.name.charAt(0).toUpperCase() : 'V'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-serif font-bold text-[#111111] truncate">
                        {cust.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#888888] block">
                        {cust.inquiries.length} {cust.inquiries.length === 1 ? 'aanvraag' : 'aanvragen'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#D8CEB8] text-[10px] font-mono font-bold text-[#666666]">
                    Verzamelaar
                  </span>
                </div>

                {/* Contact Info */}
                <div className="mt-3 space-y-2 text-xs text-[#555555]">
                  {cust.email && (
                    <a 
                      href={`mailto:${cust.email}`}
                      className="flex items-center space-x-2 text-[#111111] hover:text-[#B8860B] transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </a>
                  )}

                  {cust.phone && (
                    <a 
                      href={`tel:${cust.phone}`}
                      className="flex items-center space-x-2 text-[#111111] hover:text-[#B8860B] transition-colors truncate"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                      <span>{cust.phone}</span>
                    </a>
                  )}
                </div>

                {/* Inquiry History Preview */}
                <div className="mt-4 pt-3 border-t border-[#EAE4D8]">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#888888] tracking-wider block mb-2">
                    Interesse In
                  </span>
                  <div className="space-y-1.5">
                    {cust.inquiries.slice(0, 2).map((inq, i) => (
                      <div key={i} className="text-xs bg-[#FAF7F2] p-2 rounded-xl border border-[#EAE4D8] flex items-center justify-between">
                        <span className="font-serif font-medium text-[#111111] truncate pr-2">
                          {inq.itemTitle || 'Algemeen'}
                        </span>
                        <span className="text-[10px] font-mono text-[#888888] shrink-0">
                          {inq.status || 'Nieuw'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              {cust.email && (
                <a
                  href={`mailto:${cust.email}?subject=Fabrice%20Boeken%20%26%20Kunst`}
                  className="w-full py-2 rounded-xl bg-[#FAF7F2] border border-[#D8CEB8] text-[#111111] hover:bg-[#111111] hover:text-white text-xs font-serif font-bold transition-all text-center flex items-center justify-center space-x-2 mt-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Stuur Bericht</span>
                </a>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
