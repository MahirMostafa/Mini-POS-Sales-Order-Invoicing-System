import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Set CSRF token from document meta
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
  api.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    
    // Don't auto-popup on 404 or auth checks
    if (error.response?.status !== 404 && error.config?.url !== '/auth/me') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1',
      });
    }
    return Promise.reject(error);
  }
);

export default api;
