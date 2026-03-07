// frontend/src/components/shared/ReferralCodeField.jsx
// Drop-in referral code field with live validation.
// Used in:
//   - MainLanding.jsx (public registration modal)
//   - super-admin/Businesses.jsx (create-business form)

import React, { useState, useCallback } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { debounce } from 'lodash';
import api from '../../services/api';

export function ReferralCodeField({ value, onChange, darkMode = false }) {
  const [status,       setStatus]       = useState(null); // null | 'checking' | 'valid' | 'invalid'
  const [referrerName, setReferrerName] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validate = useCallback(
    debounce(async (code) => {
      if (!code || code.length < 4) { setStatus(null); setReferrerName(''); return; }
      setStatus('checking');
      try {
        const res = await api.get(`/api/referral/validate/${code.toUpperCase()}`);
        if (res.data.valid) {
          setStatus('valid');
          setReferrerName(res.data.referrerName);
        } else {
          setStatus('invalid');
          setReferrerName('');
        }
      } catch {
        setStatus('invalid');
        setReferrerName('');
      }
    }, 600),
    []
  );

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    onChange(val);
    validate(val);
  };

  const borderClass =
    status === 'valid'   ? 'border-emerald-400 ring-1 ring-emerald-300' :
    status === 'invalid' ? 'border-red-400 ring-1 ring-red-300' :
    darkMode             ? 'border-white/10 focus-within:border-orange-500'
                         : 'border-gray-200 focus-within:border-orange-500';

  const inputClass = darkMode
    ? 'bg-white/5 text-white placeholder-gray-500'
    : 'bg-white text-gray-900 placeholder-gray-400';

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <div className="space-y-1.5">
      <label className={`block text-sm font-semibold ${labelClass}`}>
        Referral Code <span className="font-normal opacity-60">(optional)</span>
      </label>

      <div className={`relative flex items-center border-2 rounded-xl transition-all ${borderClass}`}>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="e.g. AB3XY7KQ"
          maxLength={8}
          className={`w-full px-4 py-3 rounded-xl font-mono text-sm font-bold tracking-widest focus:outline-none bg-transparent placeholder:font-sans placeholder:font-normal placeholder:tracking-normal ${inputClass}`}
        />
        <div className="pr-4 flex-shrink-0">
          {status === 'checking' && <Loader    className="w-4 h-4 text-gray-400 animate-spin" />}
          {status === 'valid'    && <CheckCircle className="w-4 h-4 text-emerald-500" />}
          {status === 'invalid'  && <XCircle    className="w-4 h-4 text-red-400" />}
        </div>
      </div>

      {status === 'valid' && (
        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Referred by <strong className="ml-1">{referrerName}</strong> — they'll earn ₦500 when you're approved!
        </p>
      )}
      {status === 'invalid' && (
        <p className="text-xs text-red-500">
          Code not found. Check for typos or leave blank to continue.
        </p>
      )}
    </div>
  );
}

export default ReferralCodeField;