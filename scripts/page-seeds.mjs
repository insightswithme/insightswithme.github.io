/** Default Contentful Page seeds for nav routes. */

export function aboutSeed() {
  return {
    title: "About",
    slug: "about",
    metaDescription:
      "About Pawan Tyagi — Technical Lead at Altudo, Sitecore XM Cloud certified developer.",
    eyebrow: "CRAFT • PLATFORM • PURPOSE",
    headline: "The platform was always his north star.",
    intro:
      "For Pawan Tyagi, Sitecore and .NET were never just tools — they were the path to building experiences people actually use. From early days shipping .NET solutions to leading XM Cloud and Content Hub delivery at Altudo, he has been obsessed with making complex platforms feel clear. He doesn't just write code; he shares practical patterns on InsightsWithMe so other developers can ship with confidence.",
    body: `Hi,

My name is Pawan Tyagi. I have over **{{overallYears}}** years of experience in software development and **{{sitecoreYears}}** years focused on Sitecore and digital experience platforms. Currently, I work as a **Technical Lead at Altudo** in Gurugram, leading Sitecore engineering delivery across XM Cloud, Content Hub, Search, and Helix-based solutions.

I am a Sitecore 2× certified developer (including **XM Cloud Developer** and **Sitecore 10 .NET Developer**), Sitecore 9 Platform Associate Developer, **Optimizely CMS Certified Developer**, and a **Microsoft Azure Developer Associate (AZ-204)**. My toolkit also includes Helix, .NET MVC, Docker, and JSS.

Through my blog *Insights With Me*, I share practical Sitecore tutorials and real-world project learnings — from publishing and serialization to Search crawlers and Content Hub integrations — to help other developers ship with confidence.

For any queries or questions, feel free to connect with me on [LinkedIn]({{linkedinUrl}}).

Happy learning!`,
    heroImageUrl: "/images/about-story-illustration.png",
    linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
    careerStartYear: 2012,
    sitecoreStartYear: 2018,
  };
}

export function allPageSeeds() {
  return [
    aboutSeed(),
    {
      title: "Latest Blog Articles",
      slug: "blogs",
      metaDescription:
        "Sitecore CMS. A technical blog about sitecore learning for sitecore developer. Technologies like Sitecore, SXA, Headless, XM Cloud.",
      eyebrow: "",
      headline: "",
      intro:
        "Practical Sitecore, XM Cloud, Marketplace, and .NET tutorials—newest first. Prefer topic browsing? [Explore categories](/categories).",
      body: "",
      heroImageUrl: "",
      linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
      careerStartYear: null,
      sitecoreStartYear: null,
    },
    {
      title: "Blog Categories",
      slug: "categories",
      metaDescription:
        "Browse Sitecore, SXA, XM Cloud, Marketplace, Azure DevOps, and Next.js article categories. Find practical developer tutorials grouped by topic.",
      eyebrow: "",
      headline: "Sitecore & .NET Blog Categories",
      intro:
        "Explore {{totalPosts}} technical articles on Sitecore XP, SXA, XM Cloud, Marketplace apps, Azure DevOps, and modern frontend development. Pick a category to jump into focused guides and real-world solutions.",
      body: `## How to use these categories

Browse the category cards above to find focused Sitecore and .NET tutorials. Prefer a chronological feed? Visit the [full blog index](/blogs).`,
      heroImageUrl: "",
      linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
      careerStartYear: null,
      sitecoreStartYear: null,
    },
    {
      title: "Search",
      slug: "search",
      metaDescription:
        "Search Sitecore and XM Cloud blog posts, guides, and site pages.",
      eyebrow: "",
      headline: "",
      intro: "Search Sitecore and XM Cloud blog posts, guides, and site pages.",
      body: "",
      heroImageUrl: "",
      linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
      careerStartYear: null,
      sitecoreStartYear: null,
    },
    {
      title: "Portfolio",
      slug: "portfolio",
      metaDescription:
        "Portfolio of Pawan Tyagi — Sitecore XM Cloud, .NET, certifications, experience, and projects.",
      eyebrow: "",
      headline: "",
      intro: "",
      body: "",
      heroImageUrl: "",
      linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
      careerStartYear: null,
      sitecoreStartYear: null,
    },
    {
      title: "SUGCON",
      slug: "sugcon",
      metaDescription:
        "Relationship building at SUGCON India — connections with organizers, Sitecore community voices, and conversation starters that stick.",
      eyebrow: "COMMUNITY • CONNECTIONS • CONVERSATIONS",
      headline: "SUGCON is where relationships compound.",
      intro:
        "The sessions matter. The hallway conversations matter more. These are the people I met, the moments we shared, and the talking points that keep the Sitecore community moving forward — from SUGCON India 2024 through 2026.",
      body: JSON.stringify({
        ctaLabel: "Continue the conversation on LinkedIn",
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
      }),
      heroImageUrl: "/images/sugcon/sebastian-winter-2026.png",
      linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
      careerStartYear: null,
      sitecoreStartYear: null,
    },
    {
      title: "Contact Me",
      slug: "contact",
      metaDescription:
        "Have a question or want to connect? Visit my contact page to reach out to me directly. Whether you have blog-related inquiries or feedback, I'd love to hear from you!",
      eyebrow: "",
      headline: "",
      intro:
        "Thank you for visiting my blog site! Whether you have a question, feedback you'd like to discuss, I'd love to hear from you.",
      body: `## Get in Touch

- **GitHub:** [https://github.com/pawan-tyagi](https://github.com/pawan-tyagi)
- **LinkedIn:** [https://www.linkedin.com/in/pawan-tyagi-6bb22357/](https://www.linkedin.com/in/pawan-tyagi-6bb22357/)

## Why Connect with Me?

- **Blog Feedback:** Have suggestions or ideas for my blog? I'd love to hear how I can make it better for readers like you.
- **Networking:** Let's connect to share ideas, learn, and grow together in the world of tech and blogging.

## Quick Note

To ensure a prompt response, please include a clear subject when you write — via the form above or LinkedIn.`,
      heroImageUrl: "",
      linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
      careerStartYear: null,
      sitecoreStartYear: null,
    },
    {
      title: "Privacy Policy",
      slug: "privacy",
      metaDescription:
        "Your privacy matters to me. Read my privacy policy to understand how I handle your data when you visit my website and interact with my blog.",
      eyebrow: "",
      headline: "",
      intro: "",
      body: `**Effective Date:** November 16, 2025

**Last Updated:** November 16, 2025

This Privacy Policy explains how your information is collected, used, and protected when you visit [https://pawan-tyagi.github.io](https://pawan-tyagi.github.io) (the "Website"), operated by Pawan Tyagi, an individual based in India.

## 1. Information Collected

**Personal Information:** You may voluntarily provide your information (such as your name or contact details) when reaching out via LinkedIn, or through other direct communication channels.

**Non-Personal Information:** Technical details like your browser type, device, IP address, and page visits may be collected, primarily through analytics tools such as Google Analytics.

## 2. Use of Information

Your information is used for:

- Responding to inquiries made via LinkedIn
- Improving Website functionality and content
- Anonymous analytics and performance tracking
- Ensuring Website security and stability

## 3. Data Storage and Retention

Personal and non-personal data may be stored either locally or through third-party services, depending on how you contact or interact with the Website (e.g., LinkedIn, analytics platforms). Data is retained only as long as necessary for communication, site improvement, or legal obligations.

## 4. Legal Basis

The Website complies with major regulations, including the EU General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and India's Digital Personal Data Protection Act, 2023 (DPDP Act). Data is processed based on your consent, legitimate interests, or legal requirements, as applicable.

## 5. Cookies and Tracking

The Website may use cookies to enhance your experience and support anonymous analytics via Google Analytics. You can manage cookie preferences through your browser settings. No active cookie consent banner is currently displayed, but this may change for future legal compliance.

## 6. Third-Party Services

- Google Analytics: Used for site performance and visitor analytics.
- GitHub Pages: Website hosting.
- Netlify: Used for site authoring and previewing.
- LinkedIn: Used as the primary contact channel.

## 7. Data Protection and Security

Reasonable administrative and technical safeguards are in place, but no transmission over the Internet can be guaranteed as entirely secure.

## 8. Your Rights

Depending on your location, you may have rights to:

- Request access to your data
- Correct, delete, or limit the processing of your data
- Withdraw consent at any time (where processing is based on consent)

To exercise these rights, please contact via LinkedIn.

## 9. International Users

International visitors' data may be processed in India. By using this Website, you consent to such processing.

## 10. Policy Updates

This policy may be updated periodically. The latest version will always be posted on this page.

## 11. Disclaimer: Personal Views and Professional Advice

All information, content, and opinions shared via this Website are solely the personal views of Pawan Tyagi and do not necessarily reflect those of any employer, organization, or affiliated group. The materials provided are intended for informational purposes only; viewers are strongly advised to refer to official sources and recommended industry practices before using, implementing, or relying upon any information found herein.

No professional, legal, or other relationship is formed by visiting or interacting with the Website. The Website owner disclaims liability for any consequences arising from your use of the content, and recommends seeking expert or official guidance whenever appropriate.

## 12. Contact

For privacy-related questions or requests, please reach out via LinkedIn:

**Name:** Pawan Tyagi  
**Location:** Gurugram, Haryana, India`,
      heroImageUrl: "",
      linkedinUrl: "https://www.linkedin.com/in/pawan-tyagi-6bb22357/",
      careerStartYear: null,
      sitecoreStartYear: null,
    },
  ];
}
