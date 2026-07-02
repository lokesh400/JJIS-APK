import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const COOKIE_KEY = 'sid';

// const API_BASE_URL = 'http://192.168.31.30:5000/api';

const API_BASE_URL = 'https://dashboard.garudclasses.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// REQUEST INTERCEPTOR
// Reads stored session cookie and injects it as the Cookie header on every request.
apiClient.interceptors.request.use(async (config) => {
  if (Platform.OS === 'web') {
    return config;
  }

  const cookie = await AsyncStorage.getItem(COOKIE_KEY);
  if (cookie) {
    config.headers['Cookie'] = cookie;
  }
  return config;
});

// RESPONSE INTERCEPTOR
// Checks for Set-Cookie header on every response.
// Extracts just the name=value portion (drops Path, HttpOnly, SameSite flags)
// and stores it in AsyncStorage for future requests.
apiClient.interceptors.response.use(
  async (response) => {
    if (Platform.OS === 'web') {
      return response;
    }

    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const raw = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader;
      const cookieValue = raw.split(';')[0].trim();
      await AsyncStorage.setItem(COOKIE_KEY, cookieValue);
    }
    return response;
  },
  (error) => {
    // Check if the error is 401 Unauthorized (session expired or invalid)
    if (error.response && error.response.status === 401) {
      if (Platform.OS !== 'web') {
        const { DeviceEventEmitter } = require('react-native');
        DeviceEventEmitter.emit('AUTH_EXPIRED');
      } else {
        // Fallback for web if needed
        window.dispatchEvent(new Event('AUTH_EXPIRED'));
      }
    }
    return Promise.reject(error);
  }
);

// Fetch available cohorts (purchased courses) for the logged‑in student.
export const getCohorts = async () => {
  const response = await apiClient.get('/purchase/my?itemType=Course');
  const purchases = response.data || [];
  const courses = purchases.map(p => p.course || p.itemId).filter(Boolean);
  return { data: courses };
};

export default apiClient;
export { COOKIE_KEY };

// Fetch live / upcoming / completed schedule for a course.
export const getCourse = async (courseId) => {
  const response = await apiClient.get(`/courses/published/${courseId}`);
  const course = response.data;
  
  const allLectures = [];
  if (Array.isArray(course.subjects)) {
    course.subjects.forEach(subject => {
      if (Array.isArray(subject.chapters)) {
        subject.chapters.forEach(chapter => {
          if (Array.isArray(chapter.lectures)) {
            chapter.lectures.forEach(lecture => {
              allLectures.push({
                ...lecture,
                subject: subject.name,
                chapter: chapter.name
              });
            });
          }
        });
      }
    });
  } else if (Array.isArray(course.lectures)) {
    allLectures.push(...course.lectures);
  }

  const today = new Date();
  return {
    live: allLectures.filter(l => l.status === 'live'),
    upcoming: allLectures.filter(l => l.status === 'scheduled'),
    cancelled: allLectures.filter(l => l.status === 'cancelled'),
    completed: allLectures.filter(l => {
      if (l.status === 'ended' || !l.status || l.status === 'completed') {
        if (!l.scheduledAt) return false;
        const lecDate = new Date(l.scheduledAt);
        return lecDate.getFullYear() === today.getFullYear() &&
               lecDate.getMonth() === today.getMonth() &&
               lecDate.getDate() === today.getDate();
      }
      return false;
    }),
  };
};
