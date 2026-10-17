'use client';

import * as React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, MessageCircle, HelpCircle, Zap, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCompatibilityCheckerProps {
  productName: string;
  sku: string;
  slug: string;
  voltage?: string;
  current?: string;
  power?: string;
  productType?: string;
  technicalSpecs?: Array<{ key: string; value: string }>;
}

interface ControllerProfile {
  id: string;
  name: string;
  logicVoltage: number; // 3.3 or 5
  type: string;
}

const POPULAR_CONTROLLERS: ControllerProfile[] = [
  { id: 'arduino_uno', name: 'Arduino UNO / Nano / Mega', logicVoltage: 5, type: 'Microcontroller' },
  { id: 'esp32', name: 'ESP32 / ESP8266 (NodeMCU)', logicVoltage: 3.3, type: 'IoT Microcontroller' },
  { id: 'rpi_pico', name: 'Raspberry Pi Pico / RP2040', logicVoltage: 3.3, type: 'Microcontroller' },
  { id: 'rpi_4', name: 'Raspberry Pi 4 / 5 SBC', logicVoltage: 3.3, type: 'Single Board Computer' },
  { id: 'stm32', name: 'STM32 / BluePill', logicVoltage: 3.3, type: 'ARM Cortex' },
];

export function ProductCompatibilityChecker({
  productName,
  sku,
  slug,
  voltage,
  current,
  power,
  productType,
  technicalSpecs = [],
}: ProductCompatibilityCheckerProps) {
  const [selectedController, setSelectedController] = React.useState<string>('arduino_uno');

  // Detect component logic voltage
  const voltageStr = (voltage || '').toLowerCase();
  const is3v3Native = voltageStr.includes('3.3') || voltageStr.includes('3v3');
  const is5vNative = voltageStr.includes('5v') || voltageStr.includes('5 v') || (!voltageStr && !is3v3Native);
  const isHighVoltage = voltageStr.includes('12v') || voltageStr.includes('7.4v') || voltageStr.includes('11.1v') || voltageStr.includes('24v');
  const isMotorOrActuator =
    productType === 'spare_part' ||
    productName.toLowerCase().includes('motor') ||
    productName.toLowerCase().includes('servo') ||
    productName.toLowerCase().includes('driver') ||
    productName.toLowerCase().includes('pump');

  const controller = POPULAR_CONTROLLERS.find((c) => c.id === selectedController) || POPULAR_CONTROLLERS[0];

  // Evaluate compatibility
  let status: 'compatible' | 'shifter_needed' | 'driver_needed' = 'compatible';
  let title = 'Directly Compatible';
  let message = `Direct plug & play logic compatibility with ${controller.name}.`;

  if (controller.logicVoltage === 3.3 && is5vNative && !is3v3Native) {
    status = 'shifter_needed';
    title = 'Logic Level Shifter Recommended';
    message = `${controller.name} operates on 3.3V logic. While output signals may trigger 5V inputs, input pins on ${controller.name} are NOT 5V tolerant. Use a bidirectional 3.3V–5V logic level converter to protect your microcontroller.`;
  } else if (controller.logicVoltage === 5 && is3v3Native && !is5vNative) {
    status = 'shifter_needed';
    title = 'Level Shifter Required';
    message = `This component runs strictly on 3.3V logic. Connecting directly to 5V I/O pins of ${controller.name} may permanently damage the component.`;
  } else if (isMotorOrActuator) {
    status = 'driver_needed';
    title = 'External Motor Driver / Power Required';
    message = `Never power motors or high-torque servos directly from ${controller.name}'s onboard 5V/3.3V rail. Use an external battery pack (7.4V 2S LiPo recommended) and a dedicated motor driver (e.g., L298N, TB6612FNG, or DRV8833).`;
  }

  // Pre-filled WhatsApp Support Link
  const waText = encodeURIComponent(
    `Hello TTRC Store technical team! I have a question regarding compatibility for ${productName} (SKU: ${sku}, Link: https://www.ttrc.store/product/${slug}). I plan to use it with ${controller.name}. Could you please verify my wiring setup?`
  );
  const waUrl = `https://wa.me/917904902978?text=${waText}`;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
          <Cpu size={18} className="text-[#844AFB]" />
          <span>Interactive Compatibility Checker</span>
        </h3>
        <span className="text-[11px] font-bold text-[#844AFB] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
          Robotics Engineering Tool
        </span>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 block">
          Select Your Target Microcontroller / SBC Board:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {POPULAR_CONTROLLERS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedController(c.id)}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                selectedController === c.id
                  ? 'bg-purple-50 border-[#844AFB] text-[#844AFB] ring-1 ring-[#844AFB]'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <p className="truncate">{c.name}</p>
              <p className="text-[10px] font-normal text-slate-400 mt-0.5">{c.logicVoltage}V Logic</p>
            </button>
          ))}
        </div>
      </div>

      {/* Result Card */}
      <div
        className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${
          status === 'compatible'
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : status === 'shifter_needed'
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-blue-50/70 border-blue-200 text-blue-950'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          {status === 'compatible' ? (
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          ) : status === 'shifter_needed' ? (
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          ) : (
            <Zap size={16} className="text-blue-600 flex-shrink-0" />
          )}
          <span>{title}</span>
        </div>
        <p className="leading-relaxed opacity-90">{message}</p>
      </div>

      {/* Ask an Engineer CTA */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <p className="font-bold text-slate-900">Have a custom or complex robot design?</p>
          <p className="text-slate-500 text-[11px]">
            Send your wiring schematic to our robotics engineers for free verification.
          </p>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs shrink-0"
        >
          <MessageCircle size={14} />
          <span>Ask Engineer on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
