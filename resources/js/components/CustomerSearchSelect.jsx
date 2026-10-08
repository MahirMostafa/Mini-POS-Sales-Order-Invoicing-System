import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  User, 
  UserCheck, 
  UserPlus, 
  ChevronDown, 
  X, 
  Check, 
  Phone, 
  CreditCard,
  Building,
  Sparkles
} from 'lucide-react';

export default function CustomerSearchSelect({
  customers = [],
  selectedCustomer = null,
  onSelectCustomer,
  onOpenNewCustomerModal,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter customers based on name, phone, customer_code, email, company
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const code = (c.customer_code || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const company = (c.company_name || '').toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        code.includes(q) ||
        email.includes(q) ||
        company.includes(q)
      );
    });
  }, [customers, searchQuery]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredCustomers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredCustomers.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCustomers[highlightedIndex]) {
        handleSelect(filteredCustomers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const itemEl = listRef.current.children[highlightedIndex];
      if (itemEl) {
        itemEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (customer) => {
    onSelectCustomer(customer);
    setIsOpen(false);
  };

  const isWalkIn = selectedCustomer?.customer_code === 'CUST-0001' || selectedCustomer?.id === 1;

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`flex-1 flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
            isOpen
              ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isWalkIn 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-indigo-600 text-white shadow-xs'
            }`}>
              {isWalkIn ? <User className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>

            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {selectedCustomer?.name || 'Select Customer'}
                </span>
                {isWalkIn ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                    Walk-in
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 shrink-0">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {selectedCustomer?.phone || selectedCustomer?.customer_code || 'Click to search or change'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 pl-2 text-slate-400">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </div>
        </div>

        {/* Quick Add Customer Button */}
        {onOpenNewCustomerModal && (
          <button
            type="button"
            onClick={onOpenNewCustomerModal}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 transition-all shadow-xs shrink-0 flex items-center justify-center"
            title="Create new customer profile"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Top Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name, phone, code..."
              className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Customers List */}
          <div 
            ref={listRef}
            className="max-h-56 overflow-y-auto divide-y divide-slate-100/80 p-1"
          >
            {filteredCustomers.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  No customers found matching <span className="font-bold text-slate-800">"{searchQuery}"</span>
                </p>
                {onOpenNewCustomerModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenNewCustomerModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New Customer</span>
                  </button>
                )}
              </div>
            ) : (
              filteredCustomers.map((cust, idx) => {
                const isSelected = selectedCustomer?.id === cust.id;
                const isWalkInItem = cust.customer_code === 'CUST-0001' || cust.id === 1;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={cust.id}
                    onClick={() => handleSelect(cust)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-950 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100/80 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        isWalkInItem
                          ? 'bg-emerald-100 text-emerald-700'
                          : isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isWalkInItem ? <User className="w-3.5 h-3.5" /> : (cust.name ? cust.name.charAt(0).toUpperCase() : 'C')}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {cust.name}
                          </span>
                          {isWalkInItem && (
                            <span className="text-[8px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                              Walk-in
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{cust.customer_code}</span>
                          {cust.phone && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 font-sans">{cust.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Action Bar */}
          {onOpenNewCustomerModal && (
            <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium pl-1">
                {filteredCustomers.length} customer(s) available
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenNewCustomerModal();
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                <span>New Customer</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
