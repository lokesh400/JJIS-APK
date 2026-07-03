import apiClient from './client';

export const fetchMyHelpRequests = async () => {
  const res = await apiClient.get('/help/my');
  return res.data;
};

export const createHelpRequest = async (message) => {
  const res = await apiClient.post('/help', { message });
  return res.data
};
