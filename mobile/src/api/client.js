import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Point this at your machine's LAN IP when running on a physical device -
// "localhost" only resolves to the device itself, not your dev machine.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL: BASE_URL, timeout: 15000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surfaces the backend's { error, details } shape as a normal Error with
// that message, so screens can just do `catch (err) { setError(err.message) }`.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const CompetitionApi = {
  getDetails: (idOrSlug) => client.get(`/competitions/${idOrSlug}`).then((r) => r.data.data),

  register: (id, referralCode) =>
    client.post(`/competitions/${id}/register`, { referralCode }).then((r) => r.data.data),

  getMyRegistration: (id) => client.get(`/competitions/${id}/registration/me`).then((r) => r.data.data),

  confirmPayment: (registrationId, payload) =>
    client.post(`/payments/registrations/${registrationId}/confirm`, payload).then((r) => r.data.data),

  uploadSubmission: (id, fileAsset) => {
    const form = new FormData();
    form.append('media', {
      uri: fileAsset.uri,
      name: fileAsset.name || 'submission.mp4',
      type: fileAsset.mimeType || 'video/mp4',
    });
    return client
      .post(`/competitions/${id}/submissions`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data);
  },
};

export const AuthApi = {
  login: (email, password) => client.post('/auth/login', { email, password }).then((r) => r.data.data),
  signup: (payload) => client.post('/auth/signup', payload).then((r) => r.data.data),
};

export default client;
