import React from "react";

export type SugconSectionHeaderProps = {
  kicker?: string;
  title?: string;
  lede?: string;
};

/** Shared section intro — all strings from Contentful. */
const SugconSectionHeader: React.FC<SugconSectionHeaderProps> = ({
  kicker,
  title,
  lede,
}) => {
  if (!kicker && !title && !lede) return null;

  return (
    <header className="sugcon-section__head">
      {kicker ? <p className="sugcon-section__kicker">{kicker}</p> : null}
      {title ? <h2 className="sugcon-section__title">{title}</h2> : null}
      {lede ? <p className="sugcon-section__lede">{lede}</p> : null}
    </header>
  );
};

export default SugconSectionHeader;
