import React from "react";
import config from "@/lib/config";

const WhatsAppButton: React.FC = () => {
  const phone = config.whatsapp_number?.replace(/\D/g, "");
  if (!phone) return null;

  const text = encodeURIComponent(
    config.whatsapp_message ||
      "Hi Pawan, I found your blog InsightsWithMe and would like to connect."
  );
  const href = `https://wa.me/${phone}?text=${text}`;

  return (
    <a
      className="whatsapp-fab"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16 3C9 3 3.5 8.5 3.5 15.4c0 2.4.7 4.7 2 6.7L3 29l7.2-2.4c1.9 1 4 1.6 6.1 1.6 6.9 0 12.5-5.5 12.5-12.4C28.8 8.9 22.9 3 16 3zm0 22.7c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.3 1.4 1.4-4.2-.3-.4a10 10 0 1 1 9 4.9zm5.6-7.5c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-2-.9-3.4-1.7-4.7-3.8-.4-.6.4-.5 1-1.7.1-.2 0-.4 0-.6 0-.2-.7-1.7-1-2.4-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.5 3.8 6 5.3 2.1.9 2.9 1 4 .8.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.2-.6-.3z"
        />
      </svg>
    </a>
  );
};

export default WhatsAppButton;
