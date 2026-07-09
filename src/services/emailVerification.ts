import axios from 'axios';

export interface VerificationResult {
  data?: {
    status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown';
    result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
    score: number;
    email: string;
    mock?: boolean;
  };
  error?: string;
}

export async function verifyEmail(email: string): Promise<VerificationResult> {
  try {
    const response = await axios.post('/api/verify-email', { email });
    return response.data;
  } catch (error: any) {
    console.error('Verification Error:', error.response?.data || error.message);
    return {
      error: error.response?.data?.error || 'Failed to verify email'
    };
  }
}
