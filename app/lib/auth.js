// Authentication utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Sign up with email and password
export async function signUp(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Signup failed' };
    }

    // Store token in localStorage and cookies after successful signup
    if (data.token) {
      localStorage.setItem('atlas_token', data.token);
      localStorage.setItem('atlas_user', JSON.stringify(data.user));
      // Set cookie for middleware
      document.cookie = `atlas_token=${data.token}; path=/; max-age=604800; secure; samesite=strict`;
    }
    return { success: true, data };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Sign in with email and password
export async function signIn(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Signin failed' };
    }

    // Store token in localStorage and cookies
    if (data.token) {
      localStorage.setItem('atlas_token', data.token);
      localStorage.setItem('atlas_user', JSON.stringify(data.user));
      // Set cookie for middleware
      document.cookie = `atlas_token=${data.token}; path=/; max-age=604800; secure; samesite=strict`;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Signin error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    // Redirect to Google OAuth
    const googleAuthUrl = `${API_BASE_URL}/auth/google`;
    window.location.href = googleAuthUrl;
    
    return { success: true };
  } catch (error) {
    console.error('Google signin error:', error);
    return { success: false, error: 'Failed to initiate Google signin' };
  }
}

// Sign out
export async function signOut() {
  try {
    const token = localStorage.getItem('atlas_token');
    
    if (token) {
      await fetch(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    // Clear local storage and cookies
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_user');
    // Clear cookie
    document.cookie = 'atlas_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    return { success: true };
  } catch (error) {
    console.error('Signout error:', error);
    // Still clear local storage even if API call fails
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_user');
    return { success: true };
  }
}

// Get current user
export function getCurrentUser() {
  try {
    const user = localStorage.getItem('atlas_user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem('atlas_token');
  const user = localStorage.getItem('atlas_user');
  return !!(token && user);
}

// Get auth token
export function getAuthToken() {
  return localStorage.getItem('atlas_token');
}
