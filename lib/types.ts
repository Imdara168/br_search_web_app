export interface Company {
  id: string;
  englishName: string;
  khmerName: string;
  slug: string;
  createdAt: string;
}

export interface Registration {
  name_en: string;
  name_kh?: string;
  slug: string;
}

export interface CompanyFormData {
  englishName: string;
  khmerName: string;
}

export interface User {
  fullname: string;
}

export interface SignInResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
}
