import { base44 } from '@/api/base44Client';
let tokenProvider = null;
export function setLiveTokenProvider(provider) { tokenProvider = provider; }
export async function liveRequest(payload) {
  try {
    if (!tokenProvider) throw new Error('Complete Clerk sign-in before accessing your live book.');
    const token = await tokenProvider();
    if (!token) throw new Error('Your Clerk session has expired. Sign in again.');
    const response = await base44.functions.invoke('donnaIntake', { ...payload, clerk_token: token });
    if (response.data?.error) throw new Error(response.data.error);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.data?.error || error.message || 'The request could not complete.');
  }
}