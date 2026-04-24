import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/src/lib/db';
import {
  account,
  admins,
  events,
  hackerProfiles,
  hackers,
  type SubmissionStatus,
  submissions,
  teams,
  user,
} from '@/src/lib/db/schema';

async function seed() {
  console.log('Starting database seed...');

  // Create admin users
  console.log('\n--- Seeding Admin Users ---');
  const adminUsersData = [
    {
      email: 'admin@platan.us',
      password: 'admin123',
      name: 'Admin User',
    },
  ];

  for (const adminData of adminUsersData) {
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminData.email));

    if (!existingUser) {
      const userId = uuidv4();

      // Create user record
      const now = new Date();
      await db.insert(user).values({
        id: userId,
        email: adminData.email,
        name: adminData.name,
        emailVerified: true,
        userType: 'admin',
        createdAt: now,
        updatedAt: now,
      });

      // Hash password and create account
      const hashedPassword = await hashPassword(adminData.password);
      await db.insert(account).values({
        id: uuidv4(),
        userId: userId,
        accountId: adminData.email,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      // Create admin record
      await db.insert(admins).values({
        email: adminData.email,
        fullName: adminData.name,
        role: 'full',
      });

      console.log(
        `✓ Created admin: ${adminData.email} (password: ${adminData.password})`,
      );
    } else {
      console.log(`- User already exists: ${adminData.email}`);
    }
  }

  console.log('\n--- Seeding Events & Teams ---');

  // First, create an event if one doesn't exist
  let [event] = await db.select().from(events).limit(1);

  if (!event) {
    console.log('Creating event...');
    [event] = await db
      .insert(events)
      .values({
        name: 'Platanus Hack 2025',
        slug: '2025',
        priorityDeadlineAt: new Date('2025-03-01'),
        finalDeadlineAt: new Date('2025-03-15'),
        startsAt: new Date('2025-04-01'),
        endsAt: new Date('2025-04-03'),
        rsvpOpenAt: new Date('2025-03-20'),
        capacityTeams: 50,
        capacityHackers: 200,
      })
      .returning();
    console.log(`Created event: ${event.name}`);
  } else {
    console.log(`Using existing event: ${event.name}`);
  }

  // Sample teams data with real GitHub accounts
  const sampleTeams = [
    {
      status: 'approved' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Linus Torvalds',
          email: 'torvalds@linux.org',
          github: 'torvalds',
          linkedin: 'https://www.linkedin.com/in/linustorvalds',
          country: 'United States',
        },
        {
          fullName: 'Guido van Rossum',
          email: 'guido@python.org',
          github: 'gvanrossum',
          linkedin: 'https://www.linkedin.com/in/guido-van-rossum',
          country: 'Netherlands',
        },
        {
          fullName: 'Brendan Eich',
          email: 'brendan@brave.com',
          github: 'BrendanEich',
          linkedin: 'https://www.linkedin.com/in/brendaneich',
          country: 'United States',
        },
      ],
    },
    {
      status: 'priority_waiting' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Andrej Karpathy',
          email: 'andrej@openai.com',
          github: 'karpathy',
          linkedin: 'https://www.linkedin.com/in/andrej-karpathy',
          country: 'Slovakia',
        },
        {
          fullName: 'Jeremy Howard',
          email: 'jeremy@fast.ai',
          github: 'jph00',
          linkedin: 'https://www.linkedin.com/in/howardjeremy',
          country: 'Australia',
        },
      ],
    },
    {
      status: 'received' as SubmissionStatus,
      cohort: 'final' as const,
      members: [
        {
          fullName: 'Evan You',
          email: 'evan@vuejs.org',
          github: 'yyx990803',
          linkedin: 'https://www.linkedin.com/in/evanyou',
          country: 'China',
        },
        {
          fullName: 'Dan Abramov',
          email: 'dan@react.dev',
          github: 'gaearon',
          linkedin: 'https://www.linkedin.com/in/dan-abramov',
          country: 'United Kingdom',
        },
        {
          fullName: 'Rich Harris',
          email: 'rich@svelte.dev',
          github: 'Rich-Harris',
          linkedin: 'https://www.linkedin.com/in/rich-harris',
          country: 'United Kingdom',
        },
      ],
    },
    {
      status: 'onboarding_complete' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Ryan Dahl',
          email: 'ryan@deno.com',
          github: 'ry',
          linkedin: 'https://www.linkedin.com/in/ryan-dahl',
          country: 'United States',
        },
        {
          fullName: 'TJ Holowaychuk',
          email: 'tj@apex.sh',
          github: 'tj',
          linkedin: 'https://www.linkedin.com/in/tjholowaychuk',
          country: 'Canada',
        },
      ],
    },
    {
      status: 'received' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Mitchell Hashimoto',
          email: 'mitchell@hashicorp.com',
          github: 'mitchellh',
          linkedin: 'https://www.linkedin.com/in/mitchellh',
          country: 'United States',
        },
        {
          fullName: 'Solomon Hykes',
          email: 'solomon@docker.com',
          github: 'shykes',
          linkedin: 'https://www.linkedin.com/in/solomonhykes',
          country: 'France',
        },
        {
          fullName: 'Max Howell',
          email: 'max@brew.sh',
          github: 'mxcl',
          linkedin: 'https://www.linkedin.com/in/mxcl',
          country: 'United Kingdom',
        },
      ],
    },
    {
      status: 'rejected' as SubmissionStatus,
      cohort: 'final' as const,
      members: [
        {
          fullName: 'Sindre Sorhus',
          email: 'sindre@sindresorhus.com',
          github: 'sindresorhus',
          linkedin: 'https://www.linkedin.com/in/sindresorhus',
          country: 'Norway',
        },
        {
          fullName: 'Kent C. Dodds',
          email: 'kent@kentcdodds.com',
          github: 'kentcdodds',
          linkedin: 'https://www.linkedin.com/in/kentcdodds',
          country: 'United States',
        },
      ],
    },
    {
      status: 'approved' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Guillermo Rauch',
          email: 'rauchg@vercel.com',
          github: 'rauchg',
          linkedin: 'https://www.linkedin.com/in/guillermo-rauch',
          country: 'Argentina',
        },
        {
          fullName: 'Sebastian McKenzie',
          email: 'sebmck@gmail.com',
          github: 'kittens',
          linkedin: 'https://www.linkedin.com/in/sebastian-mckenzie',
          country: 'Australia',
        },
      ],
    },
    {
      status: 'priority_waiting' as SubmissionStatus,
      cohort: 'final' as const,
      members: [
        {
          fullName: 'Addy Osmani',
          email: 'addy@google.com',
          github: 'addyosmani',
          linkedin: 'https://www.linkedin.com/in/addyosmani',
          country: 'United Kingdom',
        },
        {
          fullName: 'Sarah Drasner',
          email: 'sarah@vue.js',
          github: 'sdras',
          linkedin: 'https://www.linkedin.com/in/sarahdrasner',
          country: 'United States',
        },
        {
          fullName: 'Wes Bos',
          email: 'wes@wesbos.com',
          github: 'wesbos',
          linkedin: 'https://www.linkedin.com/in/wesbos',
          country: 'Canada',
        },
      ],
    },
    {
      status: 'rsvp_open' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Kyle Simpson',
          email: 'kyle@getify.me',
          github: 'getify',
          linkedin: 'https://www.linkedin.com/in/getify',
          country: 'United States',
        },
        {
          fullName: 'Douglas Crockford',
          email: 'douglas@crockford.com',
          github: 'douglascrockford',
          linkedin: 'https://www.linkedin.com/in/douglas-crockford',
          country: 'United States',
        },
      ],
    },
    {
      status: 'received' as SubmissionStatus,
      cohort: 'final' as const,
      members: [
        {
          fullName: 'Brad Frost',
          email: 'brad@bradfrost.com',
          github: 'bradfrost',
          linkedin: 'https://www.linkedin.com/in/bradfrost',
          country: 'United States',
        },
        {
          fullName: 'Chris Coyier',
          email: 'chris@css-tricks.com',
          github: 'chriscoyier',
          linkedin: 'https://www.linkedin.com/in/chriscoyier',
          country: 'United States',
        },
      ],
    },
    {
      status: 'received' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Adrien Schildknech',
          email: 'adrien@github.com',
          github: 'adri326',
          linkedin: 'https://www.linkedin.com/in/adrien-schildknech',
          country: 'France',
        },
        {
          fullName: 'Sam Soffes',
          email: 'sam@soff.es',
          github: 'soffes',
          linkedin: 'https://www.linkedin.com/in/soffes',
          country: 'United States',
        },
        {
          fullName: 'Mattias Johansson',
          email: 'mpj@mpj.me',
          github: 'mpj',
          linkedin: 'https://www.linkedin.com/in/mpj',
          country: 'Sweden',
        },
      ],
    },
    {
      status: 'withdrawn' as SubmissionStatus,
      cohort: 'final' as const,
      members: [
        {
          fullName: 'Scott Hanselman',
          email: 'scott@hanselman.com',
          github: 'shanselman',
          linkedin: 'https://www.linkedin.com/in/shanselman',
          country: 'United States',
        },
      ],
    },
    {
      status: 'onboarding_complete' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Nicole Sullivan',
          email: 'nicole@stubbornella.org',
          github: 'stubbornella',
          linkedin: 'https://www.linkedin.com/in/nicolesullivan',
          country: 'United States',
        },
        {
          fullName: 'Lea Verou',
          email: 'lea@verou.me',
          github: 'leaverou',
          linkedin: 'https://www.linkedin.com/in/leaverou',
          country: 'Greece',
        },
      ],
    },
    {
      status: 'approved' as SubmissionStatus,
      cohort: 'final' as const,
      members: [
        {
          fullName: 'Tom Preston-Werner',
          email: 'tom@github.com',
          github: 'mojombo',
          linkedin: 'https://www.linkedin.com/in/mojombo',
          country: 'United States',
        },
        {
          fullName: 'Chris Wanstrath',
          email: 'chris@github.com',
          github: 'defunkt',
          linkedin: 'https://www.linkedin.com/in/defunkt',
          country: 'United States',
        },
        {
          fullName: 'PJ Hyett',
          email: 'pj@github.com',
          github: 'pjhyett',
          linkedin: 'https://www.linkedin.com/in/pjhyett',
          country: 'United States',
        },
      ],
    },
    {
      status: 'priority_waiting' as SubmissionStatus,
      cohort: 'priority' as const,
      members: [
        {
          fullName: 'Tobias Koppers',
          email: 'tobias@webpack.js',
          github: 'sokra',
          linkedin: 'https://www.linkedin.com/in/sokra',
          country: 'Germany',
        },
        {
          fullName: 'Sean Larkin',
          email: 'sean@webpack.js',
          github: 'TheLarkInn',
          linkedin: 'https://www.linkedin.com/in/sean-larkin',
          country: 'United States',
        },
      ],
    },
    {
      status: 'onboarding_expired' as SubmissionStatus,
      cohort: 'final' as const,
      members: [
        {
          fullName: 'André Staltz',
          email: 'andre@staltz.com',
          github: 'staltz',
          linkedin: 'https://www.linkedin.com/in/andrestaltz',
          country: 'Finland',
        },
        {
          fullName: 'Brian Lonsdorf',
          email: 'brian@drboolean.com',
          github: 'DrBoolean',
          linkedin: 'https://www.linkedin.com/in/blonsdorf',
          country: 'United States',
        },
      ],
    },
  ];

  for (const teamData of sampleTeams) {
    const teamTitle = teamData.members.map((m) => m.fullName).join(', ');
    console.log(`\nCreating team: ${teamTitle}...`);

    // Create team
    const [team] = await db
      .insert(teams)
      .values({
        eventId: event.id,
        slug: `team-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        formedOnSite: false,
      })
      .returning();

    console.log(`  Created team with ID: ${team.id}`);

    // Create hackers
    const createdHackers: Array<{ id: string; fullName: string }> = [];
    for (const memberData of teamData.members) {
      const [hacker] = await db
        .insert(hackers)
        .values({
          email: memberData.email,
          fullName: memberData.fullName,
          github: memberData.github,
          linkedin: memberData.linkedin,
        })
        .returning();

      createdHackers.push({
        id: hacker.id,
        fullName: hacker.fullName,
      });

      console.log(`  Added member: ${memberData.fullName}`);
    }

    // Create submission with realistic data
    const submissionDate = new Date();
    submissionDate.setDate(
      submissionDate.getDate() - Math.floor(Math.random() * 30),
    );

    const [submission] = await db
      .insert(submissions)
      .values({
        eventId: event.id,
        teamId: team.id,
        tallySubmissionId: `tally_${team.id}_${Date.now()}`,
        rawPayload: {
          fields: teamData.members.map((member) => ({
            key: 'country',
            label: 'País',
            value: member.country,
          })),
        },
        isTeam: teamData.members.length > 1,
        modality: teamData.members.length === 1 ? 'solo' : 'team',
        status: teamData.status,
        cohort: teamData.cohort,
        country: teamData.members[0]?.country || 'Unknown',
        submittedAt: submissionDate,
        source: 'tally' as const,
      })
      .returning();

    for (const member of createdHackers) {
      await db.insert(hackerProfiles).values({
        hackerId: member.id,
        submissionId: submission.id,
        teamId: team.id,
      });
    }

    console.log(`  Created submission at: ${submissionDate.toISOString()}`);
    console.log(
      `  Linked ${createdHackers.length} members via hacker_profiles`,
    );
  }

  console.log('\n✅ Seeding completed successfully!');
}

seed()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
