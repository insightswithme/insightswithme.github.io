import Document, { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

const themeBootScript = `(function(){try{var k="pt-theme";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" data-theme="light">
        <Head>
          <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
          <Script
            strategy="afterInteractive"
            src="https://identity.netlify.com/v1/netlify-identity-widget.js"
            async
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Poppins:wght@400;500;600;700&display=swap"
          />
          <link
            id="fa-stylesheet"
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
            media="print"
          />
          <noscript>
            <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
            />
          </noscript>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var l=document.getElementById("fa-stylesheet");if(!l)return;function a(){l.media="all"}l.addEventListener("load",a);if(l.sheet)a();})();`,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          <script
            dangerouslySetInnerHTML={{
              __html: `
              if (window.netlifyIdentity) {
                window.netlifyIdentity.on("init", user => {
                  if (!user) {
                    window.netlifyIdentity.on("login", () => {
                      document.location.href = "/admin/";
                    });
                  }
                });
              }
          `,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
