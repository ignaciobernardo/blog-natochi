import { createSign } from 'node:crypto';

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class GoogleServiceAccountAuth {
  private credentials: ServiceAccountCredentials;
  private scopes: string[];
  private accessToken: string | null = null;
  private expiresAt: number | null = null;

  constructor(serviceAccountBase64: string, scopes: string[]) {
    if (!serviceAccountBase64) {
      throw new Error(
        'Service account credentials not provided. Please set GOOGLE_SERVICE_ACCOUNT_BASE64 environment variable.',
      );
    }

    try {
      const decodedCredentials = Buffer.from(
        serviceAccountBase64,
        'base64',
      ).toString('utf-8');
      this.credentials = JSON.parse(decodedCredentials);
    } catch (error) {
      throw new Error(
        `Failed to decode service account credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    this.scopes = scopes;
  }

  private createJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const claim = {
      iss: this.credentials.client_email,
      scope: this.scopes.join(' '),
      aud: this.credentials.token_uri || 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const encodedClaim = Buffer.from(JSON.stringify(claim)).toString(
      'base64url',
    );

    const signatureInput = `${encodedHeader}.${encodedClaim}`;
    const sign = createSign('RSA-SHA256');
    sign.update(signatureInput);
    sign.end();

    const signature = sign.sign(this.credentials.private_key, 'base64url');

    return `${signatureInput}.${signature}`;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    const jwt = this.createJWT();

    const response = await fetch(
      this.credentials.token_uri || 'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get access token: ${response.status} - ${errorText}`,
      );
    }

    const data: AccessTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken;
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const token = await this.getAccessToken();

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
