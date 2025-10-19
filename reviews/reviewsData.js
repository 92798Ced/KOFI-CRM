// --- Loom CRM Demo Reviews Dataset ---
// Simulates aggregated review data pulled from social sources (Google + Facebook)

const demoReviews = [
  { name: "Anna Reyes", platform: "Google", rating: 5, sentiment: "positive", date: "2025-10-18", message: "Amazing service, super professional team!" },
  { name: "Carlos Dela Cruz", platform: "Facebook", rating: 5, sentiment: "positive", date: "2025-10-15", message: "Excellent work! Floors turned out great." },
  { name: "Mica Santos", platform: "Google", rating: 4, sentiment: "positive", date: "2025-10-14", message: "Fast service, good communication overall." },
  { name: "Ryan Bautista", platform: "Facebook", rating: 5, sentiment: "positive", date: "2025-10-11", message: "Friendly staff and great quality work." },
  { name: "Diana Cruz", platform: "Facebook", rating: 2, sentiment: "negative", date: "2025-10-10", message: "They missed my schedule twice and didn’t reply quickly." },
  { name: "Leo Hernandez", platform: "Google", rating: 1, sentiment: "negative", date: "2025-10-08", message: "Terrible customer support, waited a week for a callback." },
  { name: "Jessa Navarro", platform: "Google", rating: 4, sentiment: "positive", date: "2025-10-05", message: "Loved the attention to detail! Will recommend." },
  { name: "Nico Alvarez", platform: "Facebook", rating: 3, sentiment: "negative", date: "2025-10-02", message: "Good at first, but post-service cleanup was lacking." },
  { name: "Trixie Gomez", platform: "Google", rating: 5, sentiment: "positive", date: "2025-09-30", message: "Superb work! Worth every peso." },
  { name: "Harvey Pineda", platform: "Facebook", rating: 2, sentiment: "negative", date: "2025-09-28", message: "Some materials didn’t match what was promised." },
  { name: "Gab Santos", platform: "Google", rating: 5, sentiment: "positive", date: "2025-09-26", message: "Clean, efficient, and fast installation!" },
  { name: "Lara Lim", platform: "Facebook", rating: 1, sentiment: "negative", date: "2025-09-25", message: "The result didn’t match the sample shown." }
];

// Sort by date descending (newest first)
demoReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

// Expose globally for the dashboard to access
window.demoReviews = demoReviews;
console.log("✅ reviewsData.js loaded", window.demoReviews?.length);

