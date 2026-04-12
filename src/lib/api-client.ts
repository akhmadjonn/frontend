const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228/api/v1';
const TOKEN_KEY = 'avtolider:accessToken';
const REFRESH_KEY = 'avtolider:refreshToken';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

class ApiClient {
  private cachedToken: string | null = null;
  private cachedLocale: string | null = null;
  private tokenRead = false;
  private localeRead = false;
  private refreshPromise: Promise<string | null> | null = null;

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    if (!this.tokenRead) {
      this.cachedToken = localStorage.getItem(TOKEN_KEY);
      this.tokenRead = true;
    }
    return this.cachedToken;
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  }

  private getLocale(): string {
    if (typeof window === 'undefined') return 'uzLatin';
    if (!this.localeRead) {
      this.cachedLocale = localStorage.getItem('avtolider:locale') || 'uzLatin';
      this.localeRead = true;
    }
    return this.cachedLocale ?? 'uzLatin';
  }

  updateToken(token: string | null) {
    this.cachedToken = token;
    this.tokenRead = true;
  }

  updateLocale(locale: string) {
    this.cachedLocale = locale;
    this.localeRead = true;
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Deduplicate concurrent refresh attempts — all 401 responses share one refresh call
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.doRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
      if (data.success && data.data) {
        localStorage.setItem(TOKEN_KEY, data.data.accessToken);
        localStorage.setItem(REFRESH_KEY, data.data.refreshToken);
        this.updateToken(data.data.accessToken);
        return data.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (token)
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

    if (!(options.body instanceof FormData))
      (headers as Record<string, string>)['Content-Type'] = 'application/json';

    (headers as Record<string, string>)['Accept-Language'] = this.getLocale();

    let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401 && token) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        this.updateToken(null);
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json'))
      throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);

    const data: ApiResponse<T> = await response.json();

    if (!data.success)
      throw new Error(data.error?.message || 'Unknown error');

    return (data.data ?? null) as T;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
