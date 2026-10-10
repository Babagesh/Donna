import { base44 } from '@/api/base44Client';
export async function liveRequest(payload) {
  try {
    const response = await base44.functions.invoke('donnaIntake', payload);
    if (response.data?.error) throw new Error(response.data.error);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.data?.error || error.message || 'The request could not complete.');
  }
}