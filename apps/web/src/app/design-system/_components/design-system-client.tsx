'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { PriceTag } from '@/components/store/price-tag';
import { RatingStars } from '@/components/store/rating-stars';
import { QuantitySelector } from '@/components/store/quantity-selector';
import { ProductCard } from '@/components/store/product-card';
import { CategoryCard } from '@/components/store/category-card';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function DesignSystemClient() {
  const [tabValue, setTabValue] = React.useState('kits');
  const [quantity, setQuantity] = React.useState(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
            TTRC Design System Showcase
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dev-only interactive component library and brand token viewer. Hidden in production.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">Theme:</span>
          <ThemeToggle />
        </div>
      </div>

      {/* 1. Brand Color Tokens */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">1. Brand Palette Tokens</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { name: '--ttrc-purple', hex: '#6D28D9', bg: 'bg-[#6D28D9]', text: 'text-white', border: '' },
            { name: '--ttrc-dark-purple', hex: '#5B21B6', bg: 'bg-[#5B21B6]', text: 'text-white', border: '' },
            { name: '--ttrc-deep-purple', hex: '#4C1D95', bg: 'bg-[#4C1D95]', text: 'text-white', border: '' },
            { name: '--ttrc-light-purple', hex: '#8B5CF6', bg: 'bg-[#8B5CF6]', text: 'text-white', border: '' },
            { name: '--ttrc-purple-bg', hex: '#F5F3FF', bg: 'bg-[#F5F3FF]', text: 'text-purple-900', border: 'border border-purple-200' },
            { name: '--ttrc-purple-tint', hex: '#EDE9FE', bg: 'bg-[#EDE9FE]', text: 'text-purple-900', border: 'border border-purple-300' },
            { name: '--ttrc-white', hex: '#FFFFFF', bg: 'bg-white', text: 'text-black', border: 'border border-zinc-300' },
          ].map((token) => (
            <div key={token.name} className={`p-3 rounded-lg ${token.bg} ${token.text} ${token.border} font-bold`}>
              <p className="text-xs font-mono">{token.name}</p>
              <p className="text-[10px] opacity-70">{token.hex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Typography */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">2. Typography Hierarchy</h2>
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase">Display: Space Grotesk</span>
            <h1 className="font-heading text-4xl font-extrabold text-foreground">Robo Race Competition Chassis v2.0</h1>
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase">Body: Plus Jakarta Sans</span>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Precision laser-cut acrylic chassis with high-torque N20 gear motors. Fully compatible with TTRC 8-channel IR line sensors and L298N motor drivers.
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase">Gradient Heading</span>
            <h2 className="font-heading text-3xl font-extrabold gradient-text-purple">PRO ROBOTICS STORE</h2>
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase">Metallic / Chrome</span>
            <h2 className="font-heading text-3xl font-extrabold gradient-metallic">TTRC STORE</h2>
          </div>
        </div>
      </section>

      {/* 3. Button Variants */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">3. Button Variants &amp; Sizes</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="default">Default Purple</Button>
          <Button variant="glow">Purple Glow CTA</Button>
          <Button variant="outline">Outline Purple</Button>
          <Button variant="secondary">Secondary Slate</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Delete</Button>
          <Button variant="glow" size="sm">Small Glow</Button>
          <Button variant="glow" size="lg">Large Hero Button</Button>
          <Button variant="glow" disabled>Disabled State</Button>
        </div>
      </section>

      {/* 4. Form Primitives */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">4. Input, Select &amp; Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground">Text Input</label>
            <Input placeholder="Enter pincode or component name..." />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground">Select Component</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gamified-robots">Gamified Robots</SelectItem>
                <SelectItem value="stem-kits">STEM Kits</SelectItem>
                <SelectItem value="batteries">Batteries</SelectItem>
                <SelectItem value="motors">Motors</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground">Badge Variants</label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="purple">PRO DISCOUNT</Badge>
              <Badge variant="kit" className="font-bold">COMPLETE KIT</Badge>
              <Badge variant="spare">SPARE PART</Badge>
              <Badge variant="success">IN STOCK</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Navigation — Breadcrumb & Pagination */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">5. Navigation Primitives</h2>
        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-3 block">Breadcrumb</label>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/category/gamified-robots">Gamified Robots</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/category/robo-race">Robo Race</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Robo Race Pro Kit v2.0</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-3 block">Pagination</label>
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                <PaginationItem><PaginationEllipsis /></PaginationItem>
                <PaginationItem><PaginationLink href="#">8</PaginationLink></PaginationItem>
                <PaginationItem><PaginationNext href="#" /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </section>

      {/* 6. E-Commerce Specialty Components */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">6. E-Commerce Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4 space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">PriceTag</span>
            <PriceTag pricePaise={249900} mrpPaise={349900} size="default" />
          </Card>
          <Card className="p-4 space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">RatingStars</span>
            <RatingStars rating={4.8} reviewCount={42} size="default" />
          </Card>
          <Card className="p-4 space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">QuantitySelector</span>
            <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={10} />
          </Card>
        </div>
      </section>

      {/* 7. Kit/Spare Tabs */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">7. Category Tabs (Kits vs Spare Parts)</h2>
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList>
            <TabsTrigger value="kits">Complete Kits (3)</TabsTrigger>
            <TabsTrigger value="spares">Spare Parts (12)</TabsTrigger>
          </TabsList>
          <TabsContent value="kits" className="p-4 border border-border rounded-lg bg-card">
            <p className="text-sm font-semibold text-foreground">Displaying Complete Robo Race Kits with built-in bundle logic.</p>
          </TabsContent>
          <TabsContent value="spares" className="p-4 border border-border rounded-lg bg-card">
            <p className="text-sm font-semibold text-foreground">Displaying individual spare parts linked via product_compatibility.</p>
          </TabsContent>
        </Tabs>
      </section>

      {/* 8. Product & Category Cards */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">8. ProductCard &amp; CategoryCard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard id="p1" slug="robo-race-pro-kit" name="Robo Race Pro Competition Kit v2.0" brand="Tamizh Tech" productType="kit" pricePaise={249900} mrpPaise={349900} rating={4.9} reviewCount={42} imageUrl="/brand/ttrc-logo.png" stockQty={15} />
          <ProductCard id="p2" slug="n20-motor" name="N20 Micro Metal Gear Motor 300 RPM" brand="TTRC Spares" productType="spare_part" pricePaise={22000} mrpPaise={29900} rating={4.7} reviewCount={18} imageUrl="/brand/ttrc-logo.png" stockQty={50} />
          <CategoryCard slug="gamified-robots" name="Gamified Robots" itemCount={0} iconName="robot" />
          <CategoryCard slug="stem-kits" name="STEM Kits" itemCount={5} iconName="stem" />
        </div>
      </section>

      {/* 9. Skeleton & Empty State */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">9. Skeleton &amp; Empty State</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase">Skeleton Loading</span>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </Card>
          <EmptyState title="Your Cart is Empty" description="Explore our collection of Robo Race kits and STEM components." actionLabel="Start Shopping" onAction={() => alert('Navigate to shop')} />
        </div>
      </section>

      {/* 10. Glow & Animation Utilities */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">10. Glow &amp; Animation Utilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-purple-300 glow-purple-sm text-center text-sm font-semibold text-foreground">.glow-purple-sm</div>
          <div className="p-4 rounded-lg border border-purple-500 glow-purple text-center text-sm font-semibold text-foreground">.glow-purple</div>
          <div className="p-4 rounded-lg border border-purple-700 glow-purple-lg text-center text-sm font-semibold text-foreground">.glow-purple-lg</div>
        </div>
      </section>
    </div>
  );
}
