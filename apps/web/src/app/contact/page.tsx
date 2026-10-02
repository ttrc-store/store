'use client';

import * as React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900">Contact Us</h1>
          <p className="text-xs text-slate-500 mt-2">Get in touch with Tamizh Tech for order support, product inquiries, or institutional partnerships.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Contact Information */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-heading font-bold text-lg text-purple-700">Company Details</h2>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="text-purple-700 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <strong className="text-slate-900">Registered Address:</strong>
                    <p className="text-slate-500">Tamizh Tech, 12/42 Peelamedu, Coimbatore, Tamil Nadu — 641004, India</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-purple-700 flex-shrink-0" size={18} />
                  <div>
                    <strong className="text-slate-900">Phone Support:</strong>
                    <p className="text-slate-500">+91 7904902978 (Mon-Sat, 9:30 AM - 6:30 PM IST)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-purple-700 flex-shrink-0" size={18} />
                  <div>
                    <strong className="text-slate-900">Email Support:</strong>
                    <p className="text-slate-500">support@tamizhtech.in / contact@ttrc.store</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <a
                    href="https://wa.me/917904902978"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-white" /> WhatsApp Chat
                  </a>
                  <a
                    href="https://www.instagram.com/ttrc.store/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-bold text-xs shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <InstagramIcon className="w-4 h-4 text-white" /> @ttrc.store
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">GST Registration Status</h3>
              <p className="text-xs text-slate-600">
                GSTIN: <span className="font-mono text-red-600 font-semibold">Not Registered Yet</span> (Bill of Supply issued until registration complete).
              </p>
            </div>
          </div>

          {/* Right Contact Form */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Send Us a Message</h2>

            {submitted ? (
              <div className="p-6 rounded-xl bg-purple-50 border border-purple-200 text-center space-y-2">
                <p className="font-bold text-slate-900 text-sm">Message Sent Successfully!</p>
                <p className="text-xs text-slate-600">Our customer support team will respond to your email within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Your Full Name *</label>
                  <Input required placeholder="Karthik Raja" className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <Input required type="email" placeholder="name@example.com" className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <Input placeholder="+91 98765 43210" className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subject / Order ID</label>
                  <Input placeholder="Inquiry about order TTRC/25-26/100001" className="bg-white border-slate-200 h-10 focus:border-purple-600 focus:ring-purple-600" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Your Message *</label>
                  <textarea required rows={4} placeholder="How can we help you?" className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200" />
                </div>
                <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold h-11 text-xs rounded-full glow-purple-sm">
                  <Send size={14} className="mr-2" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
