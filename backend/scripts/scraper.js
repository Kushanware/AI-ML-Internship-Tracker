require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Internship = require('../models/Internship');

// Regex patterns for keywords
const AI_ML_KEYWORDS = [
  'artificial intelligence',
  'machine learning',
  'deep learning',
  'neural network',
  'data science',
  'nlp',
  'computer vision',
  'ai',
  'ml'
].map(k => new RegExp(k, 'i'));

// Platforms to scrape
const PLATFORMS = {
  internshala: {
    url: 'https://internshala.com/internships/keywords-artificial%20intelligence,machine%20learning',
    scraper: scrapeInternshala
  },
  // Add more platforms here
};

/**
 * Main scraper function that runs for all platforms
 */
async function runScrapers() {
  console.log('[Scraper] Starting scraping job:', new Date().toISOString());
  
  try {
    // Connect to MongoDB if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aiml-internships');
    }

    // Run all platform scrapers in parallel
    const results = await Promise.allSettled(
      Object.entries(PLATFORMS).map(async ([platform, config]) => {
        try {
          console.log(`[Scraper] Fetching from ${platform}...`);
          const listings = await config.scraper(config.url);
          return { platform, listings };
        } catch (err) {
          console.error(`[Scraper] Failed to scrape ${platform}:`, err);
          return { platform, listings: [] };
        }
      })
    );

    // Process results
    let totalNew = 0;
    let totalUpdated = 0;

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.listings.length > 0) {
        const { platform, listings } = result.value;
        
        for (const listing of listings) {
          // Generate unique hash
          const hash = crypto
            .createHash('md5')
            .update(listing.sourceUrl || `${listing.title}${listing.company}`)
            .digest('hex');

          try {
            // Check if listing exists
            const existing = await Internship.findOne({ uniqueHash: hash });
            
            if (!existing) {
              // Create new listing
              await Internship.create({
                ...listing,
                source: platform,
                uniqueHash: hash,
                scrapedAt: new Date()
              });
              totalNew++;
            } else if (listing.deadline && existing.deadline !== listing.deadline) {
              // Update if deadline changed
              await Internship.updateOne(
                { _id: existing._id },
                {
                  $set: {
                    deadline: listing.deadline,
                    scrapedAt: new Date()
                  }
                }
              );
              totalUpdated++;
            }
          } catch (err) {
            console.error(`[Scraper] Failed to process listing:`, {
              platform,
              title: listing.title,
              error: err.message
            });
          }
        }
      }
    }

    console.log('[Scraper] Job completed:', {
      new: totalNew,
      updated: totalUpdated,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[Scraper] Job failed:', err);
  }
}

/**
 * Scraper for Internshala
 */
async function scrapeInternshala(url) {
  // Get page HTML
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(data);
  const listings = [];

  // Parse each internship listing
  $('.internship_meta').each((i, el) => {
    try {
      const $el = $(el);
      const title = $el.find('.profile').text().trim();
      const company = $el.find('.company_name').text().trim();
      const stipendText = $el.find('.stipend').text().trim();
      const locationText = $el.find('.location_link').text().trim();
      const deadlineText = $el.find('.apply_by').text().trim();
      const detailsUrl = $el.find('.view_detail_button').attr('href');

      // Parse stipend
      let stipendMin = null;
      let stipendMax = null;
      const stipendMatch = stipendText.match(/₹\s*([\d,]+)(?:\s*-\s*₹\s*([\d,]+))?/);
      if (stipendMatch) {
        stipendMin = parseInt(stipendMatch[1].replace(/,/g, ''));
        if (stipendMatch[2]) {
          stipendMax = parseInt(stipendMatch[2].replace(/,/g, ''));
        }
      }

      // Parse deadline
      let deadline = null;
      const deadlineMatch = deadlineText.match(/(\d{1,2})(?:st|nd|rd|th)\s+([A-Za-z]+)'\s*(\d{2})/);
      if (deadlineMatch) {
        const [_, day, month, year] = deadlineMatch;
        deadline = new Date(`20${year}-${month}-${day}`);
      }

      // Check if title or description contains AI/ML keywords
      const isRelevant = AI_ML_KEYWORDS.some(pattern => 
        pattern.test(title) || pattern.test($el.find('.internship_description').text())
      );

      if (isRelevant) {
        listings.push({
          title,
          company,
          location: locationText,
          remote: locationText.toLowerCase().includes('work from home'),
          stipendMin,
          stipendMax,
          deadline,
          sourceUrl: detailsUrl ? `https://internshala.com${detailsUrl}` : null,
          skills: $el.find('.skill-chip').map((_, el) => $(el).text().trim()).get(),
          postedAt: new Date() // Actual posted date not available
        });
      }
    } catch (err) {
      console.error('[Scraper] Failed to parse listing:', err);
    }
  });

  return listings;
}

// Schedule scraper to run every 6 hours
cron.schedule('0 */6 * * *', runScrapers);

// Run immediately on script start
runScrapers();