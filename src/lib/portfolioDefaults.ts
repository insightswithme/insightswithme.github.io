/** Fallback portfolio data when Contentful is unavailable. */

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
      kind: "certification" as const,
      order: 1,
    },
    {
      title: "Optimizely CMS Certified Developer",
      issuer: "Optimizely",
      detail: "",
      kind: "certification" as const,
      order: 2,
    },
    {
      title: "Sitecore 10 .NET Developer Certification",
      issuer: "Sitecore",
      detail: "",
      kind: "certification" as const,
      order: 3,
    },
    {
      title: "Sitecore 9.0 Certified Platform Associate Developer",
      issuer: "Sitecore",
      detail: "",
      kind: "certification" as const,
      order: 4,
    },
    {
      title: "Sitecore JSS Fundamentals 9.2",
      issuer: "Sitecore — Certificate of Completion",
      detail: "",
      kind: "certification" as const,
      order: 5,
    },
    {
      title: "Building Solutions using Sitecore Helix 9.2",
      issuer: "Sitecore",
      detail: "",
      kind: "certification" as const,
      order: 6,
    },
    {
      title: "Sitecore Platform Essentials for Developers 9.0",
      issuer: "Sitecore — Certificate of Training",
      detail: "",
      kind: "certification" as const,
      order: 7,
    },
    {
      title: "Microsoft Certified: Azure Developer Associate (AZ-204)",
      issuer: "Microsoft",
      detail: "",
      kind: "certification" as const,
      order: 8,
    },
    {
      title: "Technical Blogger — Insights With Me",
      issuer: "",
      detail:
        "Authored 12+ in-depth posts on Sitecore XP, XM Cloud, Content Hub, Search, and Content SDK",
      kind: "achievement" as const,
      order: 9,
    },
    {
      title: "Sitecore Stack Exchange Contributor",
      issuer: "",
      detail:
        "Supporting developers and earning 300+ reputation points through community Q&A",
      kind: "achievement" as const,
      order: 10,
    },
    {
      title: "LinkedIn Sitecore Community Reach",
      issuer: "",
      detail:
        "Growing audience with strong engagement across Sitecore and digital experience topics",
      kind: "achievement" as const,
      order: 11,
    },
  ];
}

export function projectSeeds() {
  return [
    {
      title: "Microsite for an Energy and Product-Based Company",
      duration: "2 Months",
      description:
        "Sitecore XM Cloud, Sitecore Search, JSS (Headless), full-stack development.",
      order: 1,
    },
    {
      title: "Tiles Manufacturing Company",
      duration: "2 years +",
      description:
        "Sitecore 10.2, Coveo Search Enhancement, Sitecore Upgrade, Automated CI/CD processes, full stack development.",
      order: 2,
    },
    {
      title: "Healthcare Company",
      duration: "6 Months",
      description:
        "Sitecore 10.2, customize SXA rendering, Solr Index configuration, SXA Search Components.",
      order: 3,
    },
  ];
}
