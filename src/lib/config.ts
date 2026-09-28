import config from "../../content/config.json";

export interface Config {
  readonly base_url: string;
  readonly site_title: string;
  readonly site_description: string;
  readonly site_keywords: string[];
  readonly posts_per_page: number;
  readonly twitter_account: string;
  readonly github_account: string;
  readonly linkedin_account?: string;
  readonly stackexchange_account?: string;
  readonly contact_email?: string;
  readonly whatsapp_number?: string;
  readonly whatsapp_message?: string;
}

function resolveBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL;
  const fallback = config.base_url.replace(/\/$/, "");
  if (
    fromEnv &&
    !/^https?:\/\/localhost\b/i.test(fromEnv) &&
    !/^https?:\/\/127\./i.test(fromEnv)
  ) {
    return fromEnv.replace(/\/$/, "");
  }
  return fallback;
}

const updatedConfig: Config = {
  ...config,
  base_url: resolveBaseUrl(),
};

export default updatedConfig;
