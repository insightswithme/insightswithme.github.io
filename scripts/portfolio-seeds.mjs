/** Seed data for portfolio Contentful content types. */

export function portfolioBannerSeed() {
  return {
    eyebrow: "Hello folks!",
    headline: "I am Pawan Tyagi",
    intro:
      "Technical Lead at Altudo · Sitecore 2× Certified · XM Cloud Certified · Optimizely CMS Certified · Azure AZ-204\n\nBased in Gurugram, I lead Sitecore engineering delivery with deep experience across XM Cloud, Content Hub, Search, Helix, Optimizely, and .NET MVC — plus Docker and Azure.\n\nI share practical Sitecore insights on my blog \"InsightsWithMe\" and contribute to the developer community.",
    heroImageUrl: "/images/home-right.jpg",
    linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
    ctaLabel: "View LinkedIn Profile",
    skillsSectionTitle: "Technical Skills",
    experienceSectionTitle: "Work Experience",
    experienceImageUrl: "/images/about-us.png",
    contributionsSectionTitle: "Publications & Contributions",
    awardsSectionTitle: "Certifications & Achievements",
    projectsSectionTitle: "Recent Projects",
  };
}

export function skillGroupSeeds() {
  return [
    {
      name: "Sitecore",
      order: 1,
      skills: [
        "Sitecore XP 9.x & 10.x",
        "Sitecore XM Cloud",
        "Sitecore SXA",
        "JSS / Headless",
        "Helix architecture",
        "Content Hub / DAM Connector",
        "Sitecore Search",
      ],
    },
    {
      name: "Sitecore Modules & Tools",
      order: 2,
      skills: [
        "Sitecore Forms & Webhooks",
        "Sitecore Connect",
        "Content Serialization (SCS)",
        "PowerShell Extensions (SPE)",
        "Experience Edge / GraphQL",
        "Sitecore Stream",
      ],
    },
    {
      name: "Cloud & DevOps",
      order: 3,
      skills: [
        "Microsoft Azure (AZ-204)",
        "Docker",
        "Azure DevOps pipelines",
        "XM Cloud Deploy",
        "Git",
      ],
    },
    {
      name: "Backend",
      order: 4,
      skills: [".NET / C#", "ASP.NET MVC", "Web API", "MSSQL Server"],
    },
    {
      name: "Frontend",
      order: 5,
      skills: [
        "JavaScript",
        "jQuery",
        "Next.js / React (headless)",
        "SCSS / CSS",
      ],
    },
    {
      name: "Search",
      order: 6,
      skills: [
        "Sitecore Search (API / Feed crawlers)",
        "Solr (SXA)",
        "Coveo for Sitecore",
      ],
    },
  ];
}

export function experienceSeeds() {
  return [
    {
      organization: "Altudo, Gurugram, India",
      order: 1,
      roles: [
        {
          date: "June 2021 to Present",
          title: "Technical Lead",
          description:
            "Leading Sitecore engineering delivery — XM Cloud, Content Hub, Search, Helix-based solutions, and mentoring the development team.",
        },
        {
          date: "Earlier role at Altudo",
          title: "Senior Software Engineer",
          description: "",
        },
      ],
    },
    {
      organization: "Sapient (Publicis Sapient), Gurugram, India",
      order: 2,
      roles: [
        {
          date: "October 2016 to February 2022",
          title: "Software Engineer",
          description:
            "Built and delivered digital solutions using .NET / MVC and Sitecore for enterprise clients.",
        },
      ],
    },
    {
      organization: "Espire Infolabs, Gurugram, India",
      order: 3,
      roles: [
        {
          date: "September 2015 to October 2016",
          title: "Software Engineer",
          description:
            "Developed ASP.NET applications and contributed to consulting delivery for IT services projects.",
        },
      ],
    },
  ];
}

export function contributionSeeds() {
  return [
    {
      title: "Insights With Me",
      imageUrl: "/images/ds-blog-logo.png",
      linkUrl: "https://insightswithpawantyagi.blogspot.com/",
      ctaLabel: "Visit Blog",
      order: 1,
      openInNewTab: true,
    },
    {
      title: "Technical Blog",
      imageUrl: "/images/github-images.jpeg",
      linkUrl: "/blogs",
      ctaLabel: "View Posts",
      order: 2,
      openInNewTab: false,
    },
    {
      title: "LinkedIn",
      imageUrl: "/images/altudo-icon.png",
      linkUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
      ctaLabel: "Visit Profile",
      order: 3,
      openInNewTab: true,
    },
    {
      title: "Sitecore Stack Exchange",
      imageUrl: "/images/stack-exchange-sitecore.png",
      linkUrl: "https://sitecore.stackexchange.com",
      ctaLabel: "Visit",
      order: 4,
      openInNewTab: true,
    },
  ];
}

export function certificationSeeds() {
  return [
    {
      title: "Sitecore XM Cloud Developer Certification",
      issuer: "Sitecore",
      detail: "",
      kind: "certification",
      order: 1,
    },
    {
      title: "Optimizely CMS Certified Developer",
      issuer: "Optimizely",
      detail: "",
      kind: "certification",
      order: 2,
    },
    {
      title: "Sitecore 10 .NET Developer Certification",
      issuer: "Sitecore",
      detail: "",
      kind: "certification",
      order: 3,
    },
    {
      title: "Sitecore 9.0 Certified Platform Associate Developer",
      issuer: "Sitecore",
      detail: "",
      kind: "certification",
      order: 4,
    },
    {
      title: "Sitecore JSS Fundamentals 9.2",
      issuer: "Sitecore — Certificate of Completion",
      detail: "",
      kind: "certification",
      order: 5,
    },
    {
      title: "Building Solutions using Sitecore Helix 9.2",
      issuer: "Sitecore",
      detail: "",
      kind: "certification",
      order: 6,
    },
    {
      title: "Sitecore Platform Essentials for Developers 9.0",
      issuer: "Sitecore — Certificate of Training",
      detail: "",
      kind: "certification",
      order: 7,
    },
    {
      title: "Microsoft Certified: Azure Developer Associate (AZ-204)",
      issuer: "Microsoft",
      detail: "",
      kind: "certification",
      order: 8,
    },
    {
      title: "Technical Blogger — Insights With Me",
      issuer: "",
      detail:
        "Authored 12+ in-depth posts on Sitecore XP, XM Cloud, Content Hub, Search, and Content SDK",
      kind: "achievement",
      order: 9,
    },
    {
      title: "Sitecore Stack Exchange Contributor",
      issuer: "",
      detail:
        "Supporting developers and earning 300+ reputation points through community Q&A",
      kind: "achievement",
      order: 10,
    },
    {
      title: "LinkedIn Sitecore Community Reach",
      issuer: "",
      detail:
        "Growing audience with strong engagement across Sitecore and digital experience topics",
      kind: "achievement",
      order: 11,
    },
  ];
}

export function projectSeeds() {
  return [
    {
      title: "Orrick — Sitecore 10.4.1 Upgrade (Portal & Dotcom)",
      duration: "Jul 2026 – Present",
      description:
        "Leading Sitecore XP 10.4.1 upgrade for Orrick Portal and orrick.com Dotcom: Azure AD / SSO & Identity Server, Solr and Algolia search, CI/CD across Dev/Test/Prod, CM/CD environment build-out, load balancer and performance (Core Web Vitals) validation, and UAT readiness.",
      order: 1,
    },
    {
      title: "The Joint Commission (TJC) — XM Cloud Headless",
      duration: "Technical Lead",
      description:
        "Sitecore XM Cloud, Next.js, Netlify, ASP.NET MVC. Architected headless migration for 22,000+ accredited US healthcare organizations — reusable JSS components, dynamic templates, and secure headless delivery aligned with strict compliance requirements.",
      order: 2,
    },
    {
      title: "AFL (Fiber Optic Solutions) — Composable DXP",
      duration: "Technical Lead & Architect",
      description:
        "Sitecore XM Cloud + Next.js on Vercel. End-to-end composable architecture with Edge caching, ISR, and headless multisite to improve performance and Core Web Vitals.",
      order: 3,
    },
    {
      title: "McCormick & Company — Global Multi-site SXA",
      duration: "Lead / Architect",
      description:
        "Sitecore 9.3, SXA, .NET 4.8, MVC5, Glass Mapper. Spearheaded global multi-site implementation with custom SXA renderings and SPE-based content migration automation that cut manual editorial effort by ~40%.",
      order: 4,
    },
  ];
}
