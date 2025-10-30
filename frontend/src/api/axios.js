import axios from 'axios' ;
const BACKEND_URL = 'https://be-medical-camp.apps.swecha.org';
//const BACKEND_URL = 'http://localhost:5002';

const publicAxios = axios.create({
    baseURL: BACKEND_URL,
});

const privateAxios = axios.create({
    baseURL: BACKEND_URL,
    });

privateAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error)=> Promise.reject(error)
);

export { publicAxios, privateAxios };