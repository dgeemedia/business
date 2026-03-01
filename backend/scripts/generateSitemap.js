// backend/scripts/generateSitemap.js
    const prisma = require('../src/lib/prisma');
    const fs = require('fs');

    async function generate() {
      const businesses = await prisma.business.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      });

      const urls = businesses.map(b => `
      <url>
        <loc>https://www.mypadifood.com/store/${b.slug}</loc>
        <lastmod>${b.updatedAt.toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`).join('');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://www.mypadifood.com/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>${urls}
    </urlset>`;

      fs.writeFileSync('../frontend/public/sitemap.xml', xml);
      console.log(`Sitemap generated with ${businesses.length} store URLs`);
      await prisma.$disconnect();
    }

    generate().catch(console.error);
    // Run: node scripts/generateSitemap.js
