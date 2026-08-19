const LOCAL_API_URL = 'http://localhost:4000';
const PRODUCTION_API_URL = 'https://map-list-toggle-api.moosorkh.workers.dev';

const isLocalHost = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
  || (isLocalHost ? LOCAL_API_URL : PRODUCTION_API_URL);
