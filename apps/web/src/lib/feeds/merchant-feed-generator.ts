import { connectToDatabase } from '@/lib/mongodb/client';
import { ProductModel } from '@/lib/mongodb/models';

const CANONICAL_ORIGIN = 'https://www.ttrc.store';

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanPlainText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates Google Merchant Center Product Feed in XML (RSS 2.0 with g: namespace).
 * Compatible with Google Shopping & Merchant Center automated feed crawls.
 */
export async function generateGoogleMerchantXml(): Promise<string> {
  await connectToDatabase();

  const products = await ProductModel.find({
    is_active: { $ne: false },
    status: { $ne: 'archived' },
  })
    .sort({ created_at: -1 })
    .lean();

  const itemsXml = products
    .map((p: any) => {
      const id = p.sku || p._id.toString();
      const title = escapeXml(cleanPlainText(p.name));
      const description = escapeXml(cleanPlainText(p.description || p.short_description || p.name));
      const link = `${CANONICAL_ORIGIN}/product/${p.slug}`;
      const rawImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '/brand/ttrc-logo.png';
      const imageLink = rawImage.startsWith('http') ? rawImage : `${CANONICAL_ORIGIN}${rawImage}`;
      const availability = (p.stock_quantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock';
      const price = `${((p.price ?? 0) / 100).toFixed(2)} INR`;
      const brand = escapeXml(cleanPlainText(p.brand || 'Tamizh Tech'));
      const mpn = escapeXml(cleanPlainText(p.sku || p._id.toString()));
      const gstPercent = p.gst_percent ?? 18;

      return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:adult>no</g:adult>
      <g:google_product_category>Toys &amp; Games &gt; Toys &gt; Educational Toys &gt; STEM Toys</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      <g:mpn>${mpn}</g:mpn>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard Speed Courier</g:service>
        <g:price>0.00 INR</g:price>
      </g:shipping>
      <g:tax>
        <g:country>IN</g:country>
        <g:rate>${gstPercent}</g:rate>
        <g:tax_ship>yes</g:tax_ship>
      </g:tax>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TTRC Store — Tamizh Tech Robotics Product Feed</title>
    <link>${CANONICAL_ORIGIN}</link>
    <description>Official merchant product feed of Tamizh Tech Robotics Company (TTRC Store). Genuine robotics kits, competition platforms, and electronics components with India-wide delivery.</description>
${itemsXml}
  </channel>
</rss>`;
}

/**
 * Generates Google Merchant Center Product Feed in Tab-Separated Values (.tsv / .txt).
 * Directly matches Google's official product file attribute spreadsheet specification.
 */
export async function generateGoogleMerchantTsv(): Promise<string> {
  await connectToDatabase();

  const products = await ProductModel.find({
    is_active: { $ne: false },
    status: { $ne: 'archived' },
  })
    .sort({ created_at: -1 })
    .lean();

  const headers = [
    'id',
    'title',
    'description',
    'price',
    'condition',
    'link',
    'availability',
    'image_link',
    'brand',
    'mpn',
    'identifier_exists',
    'adult',
    'google_product_category',
  ];

  const rows = products.map((p: any) => {
    const id = cleanPlainText(p.sku || p._id.toString());
    const title = cleanPlainText(p.name);
    const description = cleanPlainText(p.description || p.short_description || p.name);
    const price = `${((p.price ?? 0) / 100).toFixed(2)} INR`;
    const condition = 'new';
    const link = `${CANONICAL_ORIGIN}/product/${p.slug}`;
    const availability = (p.stock_quantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock';
    const rawImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '/brand/ttrc-logo.png';
    const imageLink = rawImage.startsWith('http') ? rawImage : `${CANONICAL_ORIGIN}${rawImage}`;
    const brand = cleanPlainText(p.brand || 'Tamizh Tech');
    const mpn = cleanPlainText(p.sku || p._id.toString());
    const identifierExists = 'no';
    const adult = 'no';
    const googleProductCategory = 'Toys & Games > Toys > Educational Toys > STEM Toys';

    return [
      id,
      title,
      description,
      price,
      condition,
      link,
      availability,
      imageLink,
      brand,
      mpn,
      identifierExists,
      adult,
      googleProductCategory,
    ].join('\t');
  });

  return [headers.join('\t'), ...rows].join('\n');
}

export async function generateChatGptProductJson(): Promise<any> {
  await connectToDatabase();

  const products = await ProductModel.find({
    is_active: { $ne: false },
    status: { $ne: 'archived' },
  })
    .sort({ created_at: -1 })
    .lean();

  return {
    version: 'https://json-feed.org/version/1.1',
    title: 'TTRC Store — AI Merchant Discovery Feed',
    home_page_url: CANONICAL_ORIGIN,
    feed_url: `${CANONICAL_ORIGIN}/feeds/chatgpt.json`,
    description:
      'Product catalog feed for AI-powered discovery and conversational search engines (ChatGPT, Google AI, Perplexity).',
    merchant: {
      name: 'Tamizh Tech',
      brand: 'TTRC Store',
      website: 'https://www.tamizhtech.in',
      store_url: CANONICAL_ORIGIN,
      country: 'IN',
      currency: 'INR',
      contact: {
        email: 'support@ttrc.store',
        phone: '+91-9790238128',
      },
    },
    items: products.map((p: any) => {
      const rawImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '/brand/ttrc-logo.png';
      const imageLink = rawImage.startsWith('http') ? rawImage : `${CANONICAL_ORIGIN}${rawImage}`;

      return {
        id: p.sku || p._id.toString(),
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        title: p.name,
        summary: cleanPlainText(p.short_description || p.name),
        content_text: cleanPlainText(p.description || p.short_description || p.name),
        url: `${CANONICAL_ORIGIN}/product/${p.slug}`,
        image: imageLink,
        price_paise: p.price ?? 0,
        price_formatted: `₹${((p.price ?? 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        currency: 'INR',
        availability: (p.stock_quantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock',
        stock_quantity: p.stock_quantity ?? 0,
        brand: p.brand || 'Tamizh Tech',
        category_id: p.category_id,
        condition: 'new',
        country_of_origin: p.country_of_origin || 'India',
        hsn_code: p.hsn_code || '8542',
        technical_specifications: Array.isArray(p.technical_specs) ? p.technical_specs : [],
        applications: Array.isArray(p.applications) ? p.applications : [],
        shipping: {
          country: 'IN',
          rate: 'Free Standard Delivery',
          dispatch_days: '1-2 business days',
        },
      };
    }),
  };
}
