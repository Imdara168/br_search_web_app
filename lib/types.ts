export interface Company {
  id: string;
  englishName: string;
  khmerName: string;
  entityCode: string;
  slug: string;
  createdAt: string;
}

export interface Registration {
  name_en: string;
  name_kh?: string | null;
  entity_code?: string | null;
  created_at?: string;
  slug: string;
}

export interface PaginatedRegistrationsResponse {
  data: Registration[];
  total: number;
  page: number;
  limit: number;
}

export interface CompanyFormData {
  englishName: string;
  khmerName: string;
  entityCode: string;
}

export interface ApiMessageResponse {
  message?: string;
}

export interface User {
  fullname: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface SignInResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
}
