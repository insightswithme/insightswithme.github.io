/**
 * Seed data for SUGCON — used ONLY for first-time Contentful bootstrap.
 * Runtime page never reads these; Contentful Delivery API is the source of truth.
 */

export function sugconPageSeed() {
  return {
    title: "SUGCON",
    metaDescription:
      "Relationship building at SUGCON India — connections with organizers, Sitecore community voices, and conversation starters that stick.",
    eyebrow: "COMMUNITY • CONNECTIONS • CONVERSATIONS",
    headline: "SUGCON is where relationships compound.",
    intro:
      "The sessions matter. The hallway conversations matter more. These are the people I met, the moments we shared, and the talking points that keep the Sitecore community moving forward — from SUGCON India 2024 through 2026.",
    ctaLabel: "Continue the conversation on LinkedIn",
    linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
    heroLocalPath: "/images/sugcon/sebastian-winter-2026.png",
    peopleKicker: "Key people",
    peopleTitle: "Relationships built on the floor",
    peopleLede:
      "Names, faces, and the notes I want to remember — not a speaker list, a connection list.",
    insightsKicker: "Conversation starters",
    insightsTitle: "Points worth carrying into the next chat",
    insightsLede:
      "Session highlights that became follow-up topics with the people above — framing, not a transcript.",
    momentsKicker: "On the floor",
    momentsTitle: "Moments that sealed the handshake",
    momentsLede:
      "Proof of presence — booths, backdrops, and the people standing beside you.",
  };
}

/** @deprecated use sugconPageSeed */
export function sugconBannerSeed() {
  const p = sugconPageSeed();
  return {
    title: p.title,
    slug: "sugcon",
    metaDescription: p.metaDescription,
    eyebrow: p.eyebrow,
    headline: p.headline,
    intro: p.intro,
    heroImageUrl: p.heroLocalPath,
    linkedinUrl: p.linkedinUrl,
    body: "",
  };
}

/** @deprecated use sugconPageSeed section fields */
export function sugconSectionCopySeed() {
  const p = sugconPageSeed();
  return {
    ctaLabel: p.ctaLabel,
    peopleKicker: p.peopleKicker,
    peopleTitle: p.peopleTitle,
    peopleLede: p.peopleLede,
    insightsKicker: p.insightsKicker,
    insightsTitle: p.insightsTitle,
    insightsLede: p.insightsLede,
    momentsKicker: p.momentsKicker,
    momentsTitle: p.momentsTitle,
    momentsLede: p.momentsLede,
  };
}

export function connectionSeeds() {
  return [
    {
      name: "Sebastian Winter",
      role: "Organizer",
      company: "Sitecore / SUGCON",
      eventName: "SUGCON India",
      eventYear: "2024 & 2026",
      connectionNote:
        "Met Sebastian across two SUGCON India editions — as organizer and community anchor. These photos are reminders that showing up year after year turns a handshake into a real working relationship in the Sitecore ecosystem.",
      photoLocalPath: "/images/sugcon/sebastian-winter-2026.png",
      galleryLocalPaths: [
        "/images/sugcon/sebastian-winter-2026.png",
        "/images/sugcon/sebastian-winter-2024.png",
        "/images/sugcon/sugcon-2024-sitecore.png",
      ],
      featured: true,
      order: 1,
    },
    {
      name: "Rob",
      role: "Sitecore community",
      company: "Community",
      eventName: "SUGCON India",
      eventYear: "2026",
      connectionNote:
        "Connected at the Altudo booth and around the venue — the kind of easy, generous conversation that makes SUGCON feel like a reunion, not a trade show. Booth chats, lobby catch-ups, and team photos that capture the real reason we travel for these events.",
      photoLocalPath: "/images/sugcon/networking-rob.png",
      galleryLocalPaths: [
        "/images/sugcon/networking-rob.png",
        "/images/sugcon/altudo-booth-rob.png",
        "/images/sugcon/altudo-team-rob.png",
        "/images/sugcon/altudo-team-lobby.png",
      ],
      featured: true,
      order: 2,
    },
    {
      name: "Sailash Tirkey",
      role: "Colleague",
      company: "Altudo",
      eventName: "SUGCON India",
      eventYear: "2024",
      connectionNote:
        "Shared the floor with Sailash and the Altudo crew — celebrating organizers, sponsors, and the people who make SUGCON feel like home. Team presence turns individual networking into lasting community goodwill.",
      photoLocalPath: "/images/sugcon/sebastian-winter-2024.png",
      galleryLocalPaths: ["/images/sugcon/sebastian-winter-2024.png"],
      featured: false,
      order: 3,
    },
  ];
}

export function insightSeeds() {
  return [
    {
      title: "Be headless-curious",
      summary: "Stay · Blend · Modern — you do not have to rewrite your site.",
      detail:
        "Three paths on one content tree: stay on Sitecore MVC, blend hybrid MVC + headless components, or go full headless with JSS / .NET Rendering SDK when the brief calls for it. A practical framing I keep sharing in follow-up chats after SUGCON.",
      imageLocalPath: "/images/sugcon/insight-headless-paths.png",
      eventName: "SUGCON India",
      eventYear: "2026",
      order: 1,
    },
    {
      title: "Stay current — prefer 10.5",
      summary: "Get to 10.4 or 10.5 for the longest runway into vNext.",
      detail:
        "Modern third-party stack, .NET 10 where it applies, and upgrade muscle as a habit — not a leap. This slide became one of my favorite conversation openers with peers planning their next release train.",
      imageLocalPath: "/images/sugcon/insight-stay-current.png",
      eventName: "SUGCON India",
      eventYear: "2026",
      order: 2,
    },
    {
      title: "Orchestrate agentic workflows",
      summary: "Agent API and Marketer MCP in your environment of choice.",
      detail:
        "Keynote energy around building agentic workflows where marketers and developers already work. A natural bridge from platform talk to how teams actually collaborate — which is what SUGCON relationships are for.",
      imageLocalPath: "/images/sugcon/keynote-agentic-2026.png",
      eventName: "SUGCON India",
      eventYear: "2026",
      order: 3,
    },
  ];
}

export function momentSeeds() {
  return [
    {
      title: "Selfie with the organizer",
      caption:
        "Sebastian Winter and the Altudo crew — SUGCON India 2026 welcome wall.",
      imageLocalPath: "/images/sugcon/sebastian-winter-2026.png",
      order: 1,
    },
    {
      title: "SUGCON India 2024 stage",
      caption:
        "Back at the red backdrop with Sitecore and community sponsors — connections that carried into 2026.",
      imageLocalPath: "/images/sugcon/sebastian-winter-2024.png",
      order: 2,
    },
    {
      title: "Altudo booth conversations",
      caption:
        "Networking at the Altudo presence — Sitecore AI and value creation themes.",
      imageLocalPath: "/images/sugcon/altudo-booth-rob.png",
      order: 3,
    },
    {
      title: "Team + community",
      caption:
        "Altudo team with a community friend — lobby moments between sessions.",
      imageLocalPath: "/images/sugcon/altudo-team-rob.png",
      order: 4,
    },
  ];
}
