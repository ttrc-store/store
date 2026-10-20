import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Footer from '@/components/layout/footer';

describe('Tamizh Robotics Club Footer CTA Verification', () => {
  it('renders the Tamizh Robotics Club CTA with exact copy and destination URL', () => {
    const html = renderToString(React.createElement(Footer));

    // 1. Label / Heading
    expect(html).toContain('Join Our Tamizh Robotics Club');

    // 2. Supporting text
    expect(html).toContain(
      'Connect with fellow robotics enthusiasts, build hands-on engineering skills, participate in competitions, and learn from experienced mentors.'
    );

    // 3. Button text
    expect(html).toContain('Join the Club');

    // 4. Exact destination URL
    expect(html).toContain('href="https://www.tamizhtech.in/robotics-club/join"');

    // 5. Must NOT have tracking parameters or click identifiers
    expect(html).not.toContain('utm_');
    expect(html).not.toContain('fbclid');

    // 6. Accessible security attributes
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');

    // 7. Unaltered existing footer links & sections
    expect(html).toContain('India-Wide Delivery');
    expect(html).toContain('100% Genuine Parts');
    expect(html).toContain('7-Day Replacement');
    expect(html).toContain('Secure Online Checkout');
    expect(html).toContain('/category/gamified-robots');
    expect(html).toContain('/bulk-enquiry');
    expect(html).toContain('/privacy-policy');
  });
});
