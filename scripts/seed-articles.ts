import { db } from "@/lib/db";

// Sample blog content so the gate widget has somewhere real to live. Phase 7
// adds an admin UI for managing these; until then this is the only way any
// exist. Idempotent per siteKey — re-running is a no-op once articles exist.
const SAMPLE_ARTICLES: { siteKey: string; slug: string; title: string; body: string }[] = [
  {
    siteKey: "article1",
    slug: "five-minute-morning-routine",
    title: "A Five-Minute Morning Routine That Actually Sticks",
    body: `Most morning routines fail for one simple reason: they're too ambitious. A 90-minute ritual with cold plunges and journaling sounds great in theory, but it rarely survives contact with a Tuesday.

## Start smaller than feels useful

The routines that last are the ones you could do half-asleep. Pick two or three things, not ten. A glass of water. A short stretch. Opening the blinds.

## Stack it onto something you already do

Habits attach best to existing behavior. If you already make coffee every morning, do your stretch while it brews instead of trying to remember a separate time slot.

## Let it be boring

A routine you dread is a routine you'll quit. Boring and repeatable beats impressive and abandoned by Thursday.`,
  },
  {
    siteKey: "article1",
    slug: "the-case-for-writing-things-down",
    title: "The Case for Writing Things Down",
    body: `There's a particular kind of relief that comes from getting a half-formed thought out of your head and onto a page, even if no one else ever reads it.

## It's not about the notebook

People spend a lot of energy picking the "right" system — bullet journals, apps, index cards. None of it matters much. What matters is the five seconds it takes to capture a thought before it evaporates.

## Writing clarifies thinking

A thought that feels complete in your head often falls apart the moment you try to write a full sentence about it. That's useful information, not a failure.

## Keep it low-stakes

The moment a notebook becomes precious, people stop writing in it. Use the ugly pen. Use the cheap notebook. Let it be disposable.`,
  },
  {
    siteKey: "article2",
    slug: "why-slow-internet-days-are-good-actually",
    title: "Why Slow Internet Days Are Good, Actually",
    body: `Every so often, the wifi drops or a page won't load, and for a few minutes there's nothing to do but wait. It's mildly annoying and, if you let it be, kind of nice.

## Friction used to be normal

Not long ago, waiting was just part of using anything digital. A page loaded when it loaded. That friction gave your brain a second to breathe between actions.

## Boredom is doing something

Idle moments are when a lot of quiet problem-solving happens in the background. Removing every gap removes that too.

## You don't have to engineer it

You don't need a digital detox retreat. The next time something is just slow, try not immediately reaching for a second screen to fill the gap.`,
  },
  {
    siteKey: "article2",
    slug: "a-short-defense-of-mediocre-hobbies",
    title: "A Short Defense of Mediocre Hobbies",
    body: `Somewhere along the way, hobbies started needing a return on investment — a following, a side income, a portfolio piece. It's worth remembering that being bad at something on purpose is allowed.

## Competence isn't the point

A hobby that exists purely because it's enjoyable doesn't need to produce anything, including skill. Plenty of people have painted badly, every week, for years, and loved every minute of it.

## Comparison ruins it fastest

The quickest way to kill a hobby is to compare your tenth attempt to someone else's ten-thousandth. Nobody's early work looks like their later work.

## Give yourself permission to stay bad

Some things are worth doing badly forever. That's not a failure condition — that's the whole hobby.`,
  },
];

async function main() {
  for (const siteKey of ["article1", "article2"]) {
    const existing = await db.articlePage.count({ where: { siteKey } });
    if (existing > 0) {
      console.log(`"${siteKey}" already has ${existing} article(s) — skipping.`);
      continue;
    }

    const toCreate = SAMPLE_ARTICLES.filter((a) => a.siteKey === siteKey);
    for (const article of toCreate) {
      await db.articlePage.create({ data: article });
    }
    console.log(`Created ${toCreate.length} sample article(s) for "${siteKey}".`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
