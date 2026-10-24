import * as React from 'react';

const CANONICAL_ORIGIN = 'https://www.ttrc.store';

interface ProductJsonLdProps {
  name: string;
  description: string;
  images: string[];
  sku: string;
  brand: string;
  pricePaise: number;
  currency?: string;
  inStock: boolean;
  url?: string;
  rating?: number;
  reviewCount?: number;
}

export function ProductJsonLd({
  name,
  description,
  images,
  sku,
  brand,
  pricePaise,
  currency = 'INR',
  inStock,
  url,
  rating,
  reviewCount,
}: ProductJsonLdProps) {
  const formattedImages = images.map((img) =>
    img.startsWith('http') ? img : `${CANONICAL_ORIGIN}${img}`
  );

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: formattedImages.length > 0 ? formattedImages : [`${CANONICAL_ORIGIN}/brand/ttrc-logo.png`],
    description,
    sku,
    brand: {
      '@type': 'Brand',
      name: brand || 'Tamizh Tech',
    },
    offers: {
      '@type': 'Offer',
      url: url || `${CANONICAL_ORIGIN}/product/${sku.toLowerCase()}`,
      priceCurrency: currency,
      price: (pricePaise / 100).toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Tamizh Tech',
        url: CANONICAL_ORIGIN,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        refundType: 'https://schema.org/ExchangeRefund',
        merchantReturnLink: `${CANONICAL_ORIGIN}/return-refund-policy`,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'INR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 10,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 7,
            unitCode: 'd',
          },
        },
      },
    },
  };

  // Only emit aggregateRating if genuine reviews exist
  if (rating !== undefined && rating > 0 && reviewCount !== undefined && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toString(),
      reviewCount: reviewCount.toString(),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${CANONICAL_ORIGIN}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tamizh Tech',
    alternateName: ['TTRC', 'Tamizh Tech Robotics Company', 'TTRC Store'],
    url: CANONICAL_ORIGIN,
    logo: `${CANONICAL_ORIGIN}/brand/ttrc-logo.png`,
    description:
      'Official store of Tamizh Tech (tamizhtech.in), manufacturing competition line follower robots, STEM kits, motors, sensors, and robotics components with fast shipping across India.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9790238128',
      contactType: 'customer service',
      email: 'support@ttrc.store',
      areaServed: 'IN',
      availableLanguage: ['en', 'ta'],
    },
    sameAs: ['https://www.tamizhtech.in', 'https://tamizhtech.in'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TTRC Store',
    alternateName: 'Tamizh Tech Robotics Store',
    url: CANONICAL_ORIGIN,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${CANONICAL_ORIGIN}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ItemListJsonLdProps {
  name: string;
  description?: string;
  items: Array<{ name: string; url: string; position?: number }>;
}

export function ItemListJsonLd({ name, description, items }: ItemListJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: item.position ?? idx + 1,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${CANONICAL_ORIGIN}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQJsonLd({ faqs }: { faqs: FAQItem[] }) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ArticleJsonLdProps {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
}

export function ArticleJsonLd({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  authorName = 'Tamizh Tech Engineering Team',
  imageUrl = `${CANONICAL_ORIGIN}/brand/ttrc-logo.png`,
}: ArticleJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    url: url.startsWith('http') ? url : `${CANONICAL_ORIGIN}${url}`,
    image: imageUrl.startsWith('http') ? imageUrl : `${CANONICAL_ORIGIN}${imageUrl}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: CANONICAL_ORIGIN,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tamizh Tech',
      logo: {
        '@type': 'ImageObject',
        url: `${CANONICAL_ORIGIN}/brand/ttrc-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url.startsWith('http') ? url : `${CANONICAL_ORIGIN}${url}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

