'use client';

import React from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Link as LinkIcon, 
  MessageCircle, 
  Users 
} from 'lucide-react';

export default function EditorForm({ data, onChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const inputClasses = "w-full px-4 py-3 bg-[#FAF8F5] border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-[var(--emerald-primary)] focus:border-transparent outline-none transition-all text-[var(--ink)] placeholder:text-[var(--ink-muted)]/50 text-sm";
  const labelClasses = "flex items-center gap-2 text-xs font-bold text-[var(--ink-soft)] uppercase tracking-widest mb-2";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Couple Details */}
      <section className="space-y-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--emerald-primary)] uppercase tracking-widest pb-2 border-b border-[var(--border-subtle)]">
          <Users className="w-4 h-4" />
          Couple Details
        </h3>
        
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-2">
            <label className={labelClasses}>
              <User className="w-3 h-3 text-[var(--champagne-500)]" />
              Groom's Name
            </label>
            <input
              type="text"
              name="groomName"
              value={data.groomName}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. Rahul"
            />
          </div>
          
          <div className="space-y-2">
            <label className={labelClasses}>
              <User className="w-3 h-3 text-[var(--blush-600)]" />
              Bride's Name
            </label>
            <input
              type="text"
              name="brideName"
              value={data.brideName}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. Priya"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-2">
            <label className={labelClasses}>Groom's Parents</label>
            <input
              type="text"
              name="groomParents"
              value={data.groomParents || ""}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. Mr. & Mrs. Sharma"
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Bride's Parents</label>
            <input
              type="text"
              name="brideParents"
              value={data.brideParents || ""}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. Mr. & Mrs. Verma"
            />
          </div>
        </div>
      </section>
      
      {/* Event Details */}
      <section className="space-y-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--emerald-primary)] uppercase tracking-widest pb-2 border-b border-[var(--border-subtle)]">
          <Calendar className="w-4 h-4" />
          Event Schedule
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className={labelClasses}>
              <Calendar className="w-3 h-3 text-[var(--sage-600)]" />
              Date
            </label>
            <input
              type="date"
              name="weddingDate"
              value={data.weddingDate}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          
          <div className="space-y-2">
            <label className={labelClasses}>
              <Clock className="w-3 h-3 text-[var(--sage-600)]" />
              Time
            </label>
            <input
              type="text"
              name="weddingTime"
              value={data.weddingTime}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g. 10:00 AM"
            />
          </div>
        </div>
      </section>

      {/* Location & RSVP */}
      <section className="space-y-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--emerald-primary)] uppercase tracking-widest pb-2 border-b border-[var(--border-subtle)]">
          <MapPin className="w-4 h-4" />
          Location & RSVP
        </h3>

        <div className="space-y-2">
          <label className={labelClasses}>
            <MapPin className="w-3 h-3 text-[var(--champagne-600)]" />
            Venue Name
          </label>
          <input
            type="text"
            name="venue"
            value={data.venue}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g. Grand Palace Banquets"
          />
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>
            <MapPin className="w-3 h-3 text-[var(--sage-600)]" />
            Full Address
          </label>
          <textarea
            name="venueAddress"
            value={data.venueAddress || data.venue || ""}
            onChange={handleChange}
            rows={3}
            className={`${inputClasses} resize-none`}
            placeholder="e.g. Main Road, Mumbai, Maharashtra 400001"
          />
        </div>
        
        <div className="space-y-2">
          <label className={labelClasses}>
            <LinkIcon className="w-3 h-3 text-[var(--ink-muted)]" />
            Google Maps URL
          </label>
          <input
            type="url"
            name="mapsUrl"
            value={data.mapsUrl}
            onChange={handleChange}
            className={inputClasses}
            placeholder="https://goo.gl/maps/..."
          />
        </div>
        
        <div className="space-y-2">
          <label className={labelClasses}>
            <MessageCircle className="w-3 h-3 text-[#25D366]" />
            WhatsApp Number
          </label>
          <input
            type="tel"
            name="whatsappNumber"
            value={data.whatsappNumber}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g. 919876543210"
          />
        </div>
      </section>
    </div>
  );
}
