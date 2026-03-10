const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function request(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || 'Request failed');
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

export const api = {
    // Auth
    register: (data: { name: string; email: string; password: string }) =>
        request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
        request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    me: () => request('/api/auth/me'),

    // Posts
    getPosts: (page = 1, search = '') =>
        request(`/api/posts?page=${page}&limit=9&search=${encodeURIComponent(search)}`),
    getPost: (slug: string) => request(`/api/posts/${slug}`),
    createPost: (data: object) =>
        request('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
    updatePost: (id: number, data: object) =>
        request(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePost: (id: number) =>
        request(`/api/posts/${id}`, { method: 'DELETE' }),

    // Comments
    addComment: (data: { content: string; postId: number }) =>
        request('/api/comments', { method: 'POST', body: JSON.stringify(data) }),
    deleteComment: (id: number) =>
        request(`/api/comments/${id}`, { method: 'DELETE' }),

    // Upload
    uploadImage: (file: File) => {
        const form = new FormData();
        form.append('image', file);
        return fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            credentials: 'include',
            body: form,
        }).then(async (r) => {
            const data = await r.json().catch(() => ({}));
            if (!r.ok) {
                throw new Error(data.message || 'Image upload failed');
            }
            return data;
        });
    },

    // Admin
    adminUsers: () => request('/api/admin/users'),
    adminChangeRole: (id: number, role: string) =>
        request(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    adminDeleteUser: (id: number) =>
        request(`/api/admin/users/${id}`, { method: 'DELETE' }),
    adminPosts: () => request('/api/admin/posts'),
    adminDeletePost: (id: number) =>
        request(`/api/admin/posts/${id}`, { method: 'DELETE' }),
    adminStats: () => request('/api/admin/stats'),
};
