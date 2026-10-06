'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { PriceDisplay } from '@/components/store/price-display';
import { BulkPriceTable } from '@/components/store/bulk-price-table';
import { ProductCard } from '@/components/store/product-card';
import { CategoryCard } from '@/components/store/category-card';
import { Layers, ShieldCheck, Check, Info } from 'lucide-react';

export default function DesignSystemClient() {
  const [tabValue, setTabValue] = React.useState('standard');
  const [switchState, setSwitchState] = React.useState(true);
  const [radioVal, setRadioVal] = React.useState('standard');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[#050507] flex items-center gap-3">
            TTRC Store Design System
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Master UI component library and design token standard (Plus Jakarta Sans + Space Grotesk + JetBrains Mono).
          </p>
        </div>
        <span className="text-xs font-mono bg-[#EEE8FA] text-[#6721F2] px-3 py-1.5 rounded-lg border border-purple-200 font-bold">
          v2.0 MASTER PURPLE
        </span>
      </div>

      {/* 1. Master Brand Color Tokens */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#050507]">1. Master Brand Color Tokens</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { name: '--ttrc-primary', hex: '#844AFB', bg: 'bg-[#844AFB]', text: 'text-white' },
            { name: '--ttrc-deep', hex: '#6721F2', bg: 'bg-[#6721F2]', text: 'text-white' },
            { name: '--ttrc-dark', hex: '#1E0D45', bg: 'bg-[#1E0D45]', text: 'text-white' },
            { name: '--ttrc-black', hex: '#050507', bg: 'bg-[#050507]', text: 'text-white' },
            { name: '--ttrc-background', hex: '#FDFDFD', bg: 'bg-[#FDFDFD]', text: 'text-slate-900 border border-slate-200' },
            { name: '--ttrc-lavender', hex: '#EEE8FA', bg: 'bg-[#EEE8FA]', text: 'text-[#6721F2] border border-purple-200' },
            { name: '--ttrc-soft-purple', hex: '#AF87F8', bg: 'bg-[#AF87F8]', text: 'text-white' },
            { name: '--ttrc-gray', hex: '#6D6A6A', bg: 'bg-[#6D6A6A]', text: 'text-white' },
          ].map((token) => (
            <div key={token.name} className={`p-3 rounded-xl ${token.bg} ${token.text} font-bold shadow-2xs`}>
              <p className="text-xs font-mono">{token.name}</p>
              <p className="text-[10px] opacity-80 mt-1 font-mono">{token.hex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Semantic Status Colors */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#050507]">2. Semantic Status Colors (Untouched)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-emerald-500 text-white font-bold">
            <p className="text-xs font-mono">success</p>
            <p className="text-[10px] opacity-80">#16A34A (Green)</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500 text-white font-bold">
            <p className="text-xs font-mono">warning</p>
            <p className="text-[10px] opacity-80">#D97706 (Amber)</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500 text-white font-bold">
            <p className="text-xs font-mono">error / destructive</p>
            <p className="text-[10px] opacity-80">#EF4444 (Red)</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500 text-white font-bold">
            <p className="text-xs font-mono">info</p>
            <p className="text-[10px] opacity-80">#2563EB (Blue)</p>
          </div>
        </div>
      </section>

      {/* 3. Typography Hierarchy */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#050507]">3. Typography Scale</h2>
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Headings: Space Grotesk</span>
            <h1 className="font-heading text-3xl font-extrabold text-[#050507]">Robo Race Competition Chassis v2.0</h1>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Body & Prices: Plus Jakarta Sans</span>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Precision laser-cut acrylic chassis with high-torque N20 gear motors. Fully compatible with TTRC 8-channel IR line sensors and L298N motor drivers.
            </p>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Technical Specifications: JetBrains Mono</span>
            <p className="font-mono text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 inline-block">
              SKU: TTRC-MOT-N20-6V | VOLTAGE: 6.0V DC | RPM: 600 @ NO-LOAD | CURRENT: 0.12A STALL: 1.2A
            </p>
          </div>
        </div>
      </section>

      {/* 4. Buttons */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#050507]">4. Button System</h2>
        <div className="flex flex-wrap items-center gap-3 p-6 rounded-2xl border border-slate-200 bg-white">
          <Button variant="default">Primary (#844AFB)</Button>
          <Button variant="glow">Glow Gradient</Button>
          <Button variant="secondary">Secondary Lavender</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive Red</Button>
          <Button variant="link">Link Button</Button>
          <Button variant="default" size="sm">Small (32px)</Button>
          <Button variant="default" size="lg">Large (48px)</Button>
        </div>
      </section>

      {/* 5. Inputs, Checkboxes, Switches, Radio */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#050507]">5. Form Controls</h2>
        <div className="p-6 rounded-2xl border border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Standard Text Input</label>
            <Input placeholder="Enter your full name..." />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Select Menu</label>
            <Select defaultValue="standard">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Product</SelectItem>
                <SelectItem value="kit">Complete Robotics Kit</SelectItem>
                <SelectItem value="spare">Spare Part</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-semibold text-slate-700 block">Toggles & Checks</label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="terms" defaultChecked />
                <label htmlFor="terms" className="text-xs text-slate-700 cursor-pointer">Accept terms</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={switchState} onCheckedChange={setSwitchState} id="notifs" />
                <label htmlFor="notifs" className="text-xs text-slate-700 cursor-pointer">Live alerts</label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Badges & Alerts */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#050507]">6. Badges & Alerts</h2>
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Primary Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="kit">Complete Kit</Badge>
            <Badge variant="spare">Spare Part</Badge>
            <Badge variant="success">In Stock</Badge>
            <Badge variant="warning">Low Stock</Badge>
            <Badge variant="destructive">Sold Out</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <Alert variant="info">
              <AlertTitle>Order Processing</AlertTitle>
              <AlertDescription>Your order has been confirmed and queued for packing.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertTitle>Payment Successful</AlertTitle>
              <AlertDescription>Authoritative payment captured. GST invoice generated.</AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* 7. Product Card & Price Display */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#050507]">7. Canonical Domain Components</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProductCard
            id="demo-1"
            slug="robo-race-chassis-kit"
            name="Robo Race Pro Competition Chassis Kit"
            brand="Tamizh Tech"
            productType="kit"
            pricePaise={189900}
            mrpPaise={249900}
            unit="Kit"
            stockQty={15}
            rating={4.8}
            reviewCount={12}
            imageUrl="/brand/ttrc-logo.png"
            bulkPriceTiers={[
              { minQuantity: 5, unitPricePaise: 174900 },
              { minQuantity: 10, unitPricePaise: 159900 },
            ]}
          />
          <div className="sm:col-span-1 lg:col-span-3 space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#050507]">PriceDisplay Component</h3>
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Standard</span>
                  <PriceDisplay pricePaise={189900} mrpPaise={249900} unit="piece" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Large Detail</span>
                  <PriceDisplay pricePaise={189900} mrpPaise={249900} size="lg" unit="kit" />
                </div>
              </div>
            </div>

            <BulkPriceTable
              tiers={[
                { minQuantity: 1, maxQuantity: 4, unitPricePaise: 189900 },
                { minQuantity: 5, maxQuantity: 9, unitPricePaise: 174900 },
                { minQuantity: 10, unitPricePaise: 159900 },
              ]}
              basePricePaise={189900}
              currentQuantity={6}
            />
          </div>
        </div>
      </section>

      {/* 8. States: Empty, Skeleton, Error */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#050507]">8. System States (Empty, Skeleton, Error)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            title="No orders yet"
            description="When customers place orders, they will appear here with full invoice breakdown."
            className="h-48"
          />
          <ErrorState
            title="Failed to load catalog"
            description="Could not reach the database. Please check connection and retry."
            onRetry={() => {}}
          />
        </div>
      </section>
    </div>
  );
}
