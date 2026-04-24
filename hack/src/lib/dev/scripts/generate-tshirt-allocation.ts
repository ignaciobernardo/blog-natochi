import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import * as fs from 'fs';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';

const PLATANUS_HACK_25_EVENT_ID = 'c1d62fec-80e9-412f-8930-a8738d2c7a16';

interface Hacker {
  fullName: string;
  email: string;
  gender: string | null;
  requestedShirtSize: string | null;
  requestedShoeSize: number | null;
}

interface HackerWithAllocation extends Hacker {
  assignedShirtSize: string;
  assignedShoeSize: string;
}

const SHIRT_INVENTORY = {
  S: 9,
  M: 55,
  L: 88,
  XL: 57,
};

const SHOE_INVENTORY = {
  '36-37': 10,
  '38-39': 30,
  '40-41': 50,
  '42-43': 110,
  '44-45': 20,
};

const SHIRT_SIZE_ORDER = ['S', 'M', 'L', 'XL'] as const;
const SHOE_SIZE_ORDER = ['36-37', '38-39', '40-41', '42-43', '44-45'] as const;

function getNextShirtSize(size: string): string {
  const idx = SHIRT_SIZE_ORDER.indexOf(
    size as (typeof SHIRT_SIZE_ORDER)[number],
  );
  if (idx === -1 || idx === SHIRT_SIZE_ORDER.length - 1) return size;
  return SHIRT_SIZE_ORDER[idx + 1];
}

function shoeNumberToRange(size: number): string {
  if (size <= 37) return '36-37';
  if (size <= 39) return '38-39';
  if (size <= 41) return '40-41';
  if (size <= 43) return '42-43';
  return '44-45';
}

function getNextShoeSize(range: string): string {
  const idx = SHOE_SIZE_ORDER.indexOf(
    range as (typeof SHOE_SIZE_ORDER)[number],
  );
  if (idx === -1 || idx === SHOE_SIZE_ORDER.length - 1) return range;
  return SHOE_SIZE_ORDER[idx + 1];
}

async function main() {
  // Fetch all hackers with onboarding complete in relevant submission states
  const results = await db
    .select({
      fullName: hackers.fullName,
      email: hackers.email,
      gender: hackers.gender,
      requestedShirtSize: hackerProfiles.shirtSize,
      requestedShoeSize: hackerProfiles.shoeSize,
      hackerId: hackers.id,
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(
      and(
        isNotNull(hackerProfiles.onboardCompleteAt),
        inArray(submissions.status, [
          'onboarding_request',
          'onboarding_complete',
        ]),
        eq(submissions.eventId, PLATANUS_HACK_25_EVENT_ID),
      ),
    )
    .orderBy(hackers.fullName);

  // Deduplicate by hacker_id (take first profile per hacker)
  const seenHackers = new Set<string>();
  const uniqueResults: typeof results = [];

  for (const r of results) {
    if (!seenHackers.has(r.hackerId)) {
      seenHackers.add(r.hackerId);
      uniqueResults.push(r);
    }
  }

  // Separate by gender for prioritization
  const females: Hacker[] = [];
  const others: Hacker[] = [];

  for (const h of uniqueResults) {
    if (h.gender === 'female') {
      females.push(h);
    } else {
      others.push(h);
    }
  }

  // Track remaining inventory
  const remainingShirts = { ...SHIRT_INVENTORY };
  const remainingShoes = { ...SHOE_INVENTORY };

  // Allocation results
  const allocations: HackerWithAllocation[] = [];

  // Helper to allocate a shirt
  function allocateShirt(hacker: Hacker): string {
    let size = hacker.requestedShirtSize || 'L'; // Default to L if null

    // Try to allocate requested size, or bump up
    while (
      remainingShirts[size as keyof typeof remainingShirts] <= 0 &&
      size !== 'XL'
    ) {
      size = getNextShirtSize(size);
    }

    remainingShirts[size as keyof typeof remainingShirts]--;
    return size;
  }

  // Helper to allocate shoes
  function allocateShoe(hacker: Hacker): string {
    let range = hacker.requestedShoeSize
      ? shoeNumberToRange(hacker.requestedShoeSize)
      : '42-43'; // Default to most common range if null

    // Try to allocate requested range, or bump up
    while (
      remainingShoes[range as keyof typeof remainingShoes] <= 0 &&
      range !== '44-45'
    ) {
      range = getNextShoeSize(range);
    }

    remainingShoes[range as keyof typeof remainingShoes]--;
    return range;
  }

  // Allocate females first (prioritized)
  for (const hacker of females) {
    const assignedShirt = allocateShirt(hacker);
    const assignedShoe = allocateShoe(hacker);
    allocations.push({
      ...hacker,
      assignedShirtSize: assignedShirt,
      assignedShoeSize: assignedShoe,
    });
  }

  // Allocate others
  for (const hacker of others) {
    const assignedShirt = allocateShirt(hacker);
    const assignedShoe = allocateShoe(hacker);
    allocations.push({
      ...hacker,
      assignedShirtSize: assignedShirt,
      assignedShoeSize: assignedShoe,
    });
  }

  // Sort alphabetically by name
  allocations.sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Generate CSV
  const csvLines = [
    'full_name,email,gender,requested_shirt_size,assigned_shirt_size,requested_shoe_size,assigned_shoe_size',
  ];

  for (const h of allocations) {
    const row = [
      `"${h.fullName.replace(/"/g, '""')}"`,
      `"${h.email}"`,
      `"${h.gender || ''}"`,
      `"${h.requestedShirtSize || ''}"`,
      `"${h.assignedShirtSize}"`,
      `"${h.requestedShoeSize || ''}"`,
      `"${h.assignedShoeSize}"`,
    ].join(',');
    csvLines.push(row);
  }

  const csvContent = csvLines.join('\n');
  const outputPath = './allocation.csv';

  fs.writeFileSync(outputPath, csvContent);
  console.log(`CSV generated: ${outputPath}`);
  console.log(`Total hackers: ${allocations.length}`);

  // Print shirt summary
  const shirtSummary = { correct: 0, bumped: 0 };
  for (const h of allocations) {
    const requested = h.requestedShirtSize || 'L';
    if (h.assignedShirtSize === requested) {
      shirtSummary.correct++;
    } else {
      shirtSummary.bumped++;
    }
  }

  console.log(`\nShirt allocation summary:`);
  console.log(
    `  Correct size: ${shirtSummary.correct} (${((shirtSummary.correct / allocations.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Bumped up: ${shirtSummary.bumped} (${((shirtSummary.bumped / allocations.length) * 100).toFixed(1)}%)`,
  );

  // Print shoe summary
  const shoeSummary = { correct: 0, bumped: 0 };
  for (const h of allocations) {
    const requestedRange = h.requestedShoeSize
      ? shoeNumberToRange(h.requestedShoeSize)
      : '42-43';
    if (h.assignedShoeSize === requestedRange) {
      shoeSummary.correct++;
    } else {
      shoeSummary.bumped++;
    }
  }

  console.log(`\nShoe allocation summary:`);
  console.log(
    `  Correct size: ${shoeSummary.correct} (${((shoeSummary.correct / allocations.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Bumped up: ${shoeSummary.bumped} (${((shoeSummary.bumped / allocations.length) * 100).toFixed(1)}%)`,
  );

  // Print remaining inventory
  console.log(`\nRemaining shirt inventory:`);
  console.log(`  S: ${remainingShirts.S}`);
  console.log(`  M: ${remainingShirts.M}`);
  console.log(`  L: ${remainingShirts.L}`);
  console.log(`  XL: ${remainingShirts.XL}`);

  console.log(`\nRemaining shoe inventory:`);
  console.log(`  36-37: ${remainingShoes['36-37']}`);
  console.log(`  38-39: ${remainingShoes['38-39']}`);
  console.log(`  40-41: ${remainingShoes['40-41']}`);
  console.log(`  42-43: ${remainingShoes['42-43']}`);
  console.log(`  44-45: ${remainingShoes['44-45']}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
