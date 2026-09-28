import React from "react";
import { withBasePath } from "@/lib/withBasePath";
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
      <img
        src={withBasePath("/images/whatsapp-fab.png")}
        alt=""
        width={56}
        height={56}
        decoding="async"
      />
    </a>
  );
};

export default WhatsAppButton;
