'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, ChevronRight, Sparkles } from 'lucide-react';

export interface CategoryItem {
  name: string;
  slug: string;
  icon?: string;
  subcategories?: { name: string; slug: string }[];
}

export const CATEGORIES: CategoryItem[] = [
  {
    name: 'Gamified Robots',
    slug: 'gamified-robots',
    subcategories: [
      { name: 'Robo Race (Kits & Spares)', slug: 'robo-race' },
      { name: 'Line Follower (Kits & Spares)', slug: 'line-follower' },
      { name: 'Robo Soccer (Kits & Spares)', slug: 'robo-soccer' },
    ],
  },
  {
    name: 'STEM Kits',
    slug: 'stem-kits',
    subcategories: [
      { name: 'Beginner Robotics Kits', slug: 'beginner-kits' },
      { name: 'Arduino STEM Kits', slug: 'arduino-kits' },
      { name: 'School & Club Bundles', slug: 'school-bundles' },
    ],
  },
  {
    name: 'Fasteners',
    slug: 'fasteners',
    subcategories: [
      { name: 'M2 / M3 / M4 Screws', slug: 'screws' },
      { name: 'Nuts & Lock Nuts', slug: 'nuts' },
      { name: 'Brass Standoffs & Spacers', slug: 'standoffs' },
    ],
  },
  {
    name: 'Batteries & Power',
    slug: 'batteries',
    subcategories: [
      { name: 'LiPo Batteries (2S/3S/4S)', slug: 'lipo-batteries' },
      { name: 'Li-ion 18650 Cells', slug: 'li-ion' },
      { name: 'NiMH & LiPo Chargers', slug: 'chargers' },
      { name: 'Battery Holders & BMS', slug: 'holders-bms' },
    ],
  },
  {
    name: 'Motors & Drivers',
    slug: 'motors',
    subcategories: [
      { name: 'BO Motors & Wheels', slug: 'bo-motors' },
      { name: 'DC Metal Gear Motors', slug: 'dc-motors' },
      { name: 'Servo Motors (SG90, MG996R)', slug: 'servos' },
      { name: 'Stepper & BLDC Motors', slug: 'stepper-bldc' },
      { name: 'Motor Drivers (L298N, TB6612)', slug: 'motor-drivers' },
    ],
  },
  {
    name: 'Sensors',
    slug: 'sensors',
    subcategories: [
      { name: 'IR & Obstacle Sensors', slug: 'ir-sensors' },
      { name: 'Ultrasonic Distance Sensors', slug: 'ultrasonic' },
      { name: 'IMU & Gyro Accelerometers', slug: 'imu-gyro' },
      { name: 'Colour & Light Sensors', slug: 'colour-sensors' },
      { name: 'Line Sensor Arrays (8-ch / 16-ch)', slug: 'line-arrays' },
    ],
  },
  {
    name: 'Drones',
    slug: 'drones',
    subcategories: [
      { name: 'Drone Kits', slug: 'drone-kits' },
      { name: 'Frames & Arms', slug: 'frames' },
      { name: 'Flight Controllers', slug: 'flight-controllers' },
      { name: 'Propellers & ESCs', slug: 'props-escs' },
    ],
  },
  {
    name: 'Wires & Connectors',
    slug: 'wires-connectors',
    subcategories: [
      { name: 'Jumper Wires (M-M, M-F, F-F)', slug: 'jumper-wires' },
      { name: 'XT60 & Deans Connectors', slug: 'xt60-connectors' },
      { name: 'JST & Pin Headers', slug: 'jst-headers' },
      { name: 'Silicone High Flex Wires', slug: 'silicone-wires' },
    ],
  },
];

export function MegaMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeCat, setActiveCat] = React.useState<CategoryItem>(CATEGORIES[0]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-0 w-full bg-white text-slate-900 border-b border-slate-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto flex min-h-[340px]">
        {/* Category List Sidebar */}
        <div className="w-1/3 bg-purple-50/50 p-4 border-r border-purple-100">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-3 px-3">
            Product Categories
          </p>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onMouseEnter={() => setActiveCat(cat)}
                onClick={() => setActiveCat(cat)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeCat.slug === cat.slug
                    ? 'bg-purple-700 text-white font-bold shadow-md'
                    : 'text-slate-700 hover:bg-purple-100/60 hover:text-purple-950'
                }`}
              >
                <span>{cat.name}</span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories Detail Panel */}
        <div className="flex-1 p-6 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
              <h4 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bot className="text-purple-700 w-5 h-5" />
                {activeCat.name}
              </h4>
              <Link
                href={`/category/${activeCat.slug}`}
                onClick={onClose}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
              >
                Browse All {activeCat.name} <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {activeCat.subcategories?.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/category/${activeCat.slug}/${sub.slug}`}
                  onClick={onClose}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-purple-600 hover:bg-purple-50/50 transition-all group"
                >
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-purple-700 transition-colors">
                    {sub.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Explore kits, spares & specs</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Special Feature Highlight */}
          <div className="mt-6 p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="text-purple-700 w-6 h-6 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-slate-900">Kit & Spare Parts Guarantee</p>
                <p className="text-xs text-slate-600">All spare parts are tested for 100% compatibility with TTRC kits.</p>
              </div>
            </div>
            <Link
              href="/category/gamified-robots"
              onClick={onClose}
              className="text-xs font-bold bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors"
            >
              Shop Kits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
