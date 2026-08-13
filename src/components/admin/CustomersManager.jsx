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
    <div className="admin-module-legacy admin-customers space-y-6 text-[#1C1A18] font-sans animate-fade-in">
      
      {/* Header & Search */}
      <div className="p-6 rounded-xl bg-white border border-[#EBE7DF] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1C1A18] flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#C5A059]" />
            <span>Klanten &amp; Verzamelaars Index</span>
          </h2>
          <p className="text-xs text-[#6E675E] mt-1 font-medium">
            Overzicht van alle contacten en hun getoonde interesse in uw boeken, kunst en historische objecten.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8478]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Zoek klant op naam, email, werk..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-xs text-[#1C1A18] placeholder-[#8C8478] focus:outline-none focus:border-[#C5A059]"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#EBE7DF] rounded-xl space-y-3">
          <Users className="w-10 h-10 text-[#CCCCCC] mx-auto" />
          <h3 className="text-sm font-serif font-bold text-[#6E675E]">Geen verzamelaars gevonden</h3>
          <p className="text-xs text-[#8C8478]">Probeer een andere zoekterm of wacht op nieuwe binnenkomende aanvragen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((cust) => (
            <div 
              key={cust.id}
              className="p-5 rounded-xl bg-white border border-[#EBE7DF] shadow-sm hover:shadow-md hover:border-[#C5A059] transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Client Avatar & Name */}
                <div className="flex items-start justify-between gap-3 border-b border-[#EBE7DF] pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#1C1A18] text-[#C5A059] flex items-center justify-center font-serif font-bold text-sm shadow-sm shrink-0">
                      {cust.name ? cust.name.charAt(0).toUpperCase() : 'V'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-sans font-bold text-[#1C1A18] truncate">
                        {cust.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#8C8478] block">
                        {cust.inquiries.length} {cust.inquiries.length === 1 ? 'aanvraag' : 'aanvragen'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#FDFBF7] border border-[#EBE7DF] text-[10px] font-sans font-bold text-[#6E675E]">
                    Verzamelaar
                  </span>
                </div>

                {/* Contact Info */}
                <div className="mt-3 space-y-2 text-xs text-[#6E675E] font-medium">
                  {cust.email && (
                    <a 
                      href={`mailto:${cust.email}`}
                      className="flex items-center space-x-2 text-[#1C1A18] hover:text-[#C5A059] transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </a>
                  )}

                  {cust.phone && (
                    <a 
                      href={`tel:${cust.phone}`}
                      className="flex items-center space-x-2 text-[#1C1A18] hover:text-[#C5A059] transition-colors truncate"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                      <span>{cust.phone}</span>
                    </a>
                  )}
                </div>

                {/* Inquiry History Preview */}
                <div className="mt-4 pt-3 border-t border-[#EBE7DF]">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#8C8478] tracking-wider block mb-2">
                    Interesse In
                  </span>
                  <div className="space-y-1.5">
                    {cust.inquiries.slice(0, 2).map((inq, i) => (
                      <div key={i} className="text-xs bg-[#FDFBF7] p-2 rounded-lg border border-[#EBE7DF] flex items-center justify-between">
                        <span className="font-serif font-medium text-[#1C1A18] truncate pr-2">
                          {inq.itemTitle || 'Algemeen'}
                        </span>
                        <span className="text-[10px] font-mono text-[#8C8478] shrink-0">
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
                  href={`mailto:${cust.email}?subject=Atelier%20Rembrandt`}
                  className="w-full py-2.5 rounded-lg bg-[#FDFBF7] border border-[#EBE7DF] text-[#1C1A18] hover:bg-[#1C1A18] hover:text-[#C5A059] text-xs font-sans font-bold transition-all text-center flex items-center justify-center space-x-2 mt-2"
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
