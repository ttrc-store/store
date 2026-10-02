'use client';

import * as React from 'react';
import { FolderTree, Plus, Edit, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORY_TREE = [
  {
    id: 'gamified-robots',
    name: 'Gamified Robots',
    slug: 'gamified-robots',
    itemCount: 14,
    subcategories: ['Robo Race Kits & Spares', 'Line Follower Kits & Spares', 'Robo Soccer Kits & Spares'],
  },
  {
    id: 'stem-kits',
    name: 'STEM Kits',
    slug: 'stem-kits',
    itemCount: 8,
    subcategories: ['DIY Robotics Starter', 'IoT Smart Home Kits', 'Arduino Tinkerer Kits'],
  },
  {
    id: 'motors',
    name: 'Motors & Drivers',
    slug: 'motors',
    itemCount: 12,
    subcategories: ['N20 Micro Motors', 'BO Dual Shaft Motors', 'Servos & Steppers', 'L298N & Motor Shield Drivers'],
  },
  {
    id: 'sensors',
    name: 'Sensors & Arrays',
    slug: 'sensors',
    itemCount: 10,
    subcategories: ['IR Line Sensors', 'Ultrasonic Ranging', 'MPU6050 Gyro/IMU', 'TCS3200 Colour Sensors'],
  },
  {
    id: 'batteries',
    name: 'Batteries & Power',
    slug: 'batteries',
    itemCount: 6,
    subcategories: ['3S LiPo Batteries', '18650 Li-ion Cells', 'B3 Pro Balance Chargers', 'Battery Holders & XT60'],
  },
  {
    id: 'fasteners',
    name: 'Fasteners & Hardware',
    slug: 'fasteners',
    itemCount: 15,
    subcategories: ['M3 Screws & Nuts', 'Brass Standoffs (10-30mm)', 'Nylon Spacers', 'Acrylic Motor Brackets'],
  },
  {
    id: 'drones',
    name: 'Drones & UAV Components',
    slug: 'drones',
    itemCount: 5,
    subcategories: ['F450 Quadcopter Kits', 'APM / Pixhawk Flight Controllers', 'Brushless Motors & 30A ESCs', 'Propellers (1045, 5045)'],
  },
  {
    id: 'wires-connectors',
    name: 'Wires & Connectors',
    slug: 'wires-connectors',
    itemCount: 9,
    subcategories: ['Dupont Jumper Wires (M-M, M-F)', 'XT60 / XT90 Plugs', 'JST-XH Cable Assemblies', 'Header Pins'],
  },
];

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Category Structure ({CATEGORY_TREE.length} Main Categories)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize catalog hierarchy, manage subcategories, and structure kit tabs.
          </p>
        </div>
        <Button className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm shadow-purple-900/20">
          <Plus size={16} /> Add Main Category
        </Button>
      </div>

      {/* Category Tree Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORY_TREE.map((cat) => (
          <div
            key={cat.id}
            className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
                  <FolderTree size={20} />
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-base text-slate-900">{cat.name}</h2>
                  <p className="text-[10px] text-slate-400 font-mono">/category/{cat.slug}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {cat.itemCount} items
              </span>
            </div>

            {/* Subcategories list */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subcategories</p>
              <div className="space-y-1.5">
                {cat.subcategories.map((sub, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium flex items-center gap-2">
                      <ChevronRight size={14} className="text-purple-700" /> {sub}
                    </span>
                    <button className="text-slate-400 hover:text-slate-700 p-1">
                      <Edit size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1">
                + Add Subcategory
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
