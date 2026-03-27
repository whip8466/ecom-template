export type ContactSettings = {
  headline: string;
  primaryEmail: string;
  supportEmail: string;
  phone: string;
  addressLine: string;
  mapEmbedUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  updatedAt: string;
};

export type ContactMessageRow = {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  saveInfo: boolean;
  createdAt: string;
};
