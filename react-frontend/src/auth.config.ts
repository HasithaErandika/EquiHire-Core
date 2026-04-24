
interface AuthConfig {
    signInRedirectURL: string;
    signOutRedirectURL: string;
    clientID: string;
    baseUrl: string;
    scope: string[];
    orgID: string;
}

export const authConfig: AuthConfig = {
    clientID: window.configs?.VITE_ASGARDEO_CLIENT_ID || import.meta.env.VITE_ASGARDEO_CLIENT_ID,
    baseUrl: window.configs?.VITE_ASGARDEO_BASE_URL || import.meta.env.VITE_ASGARDEO_BASE_URL,
    signInRedirectURL: window.configs?.VITE_REDIRECT_URL || import.meta.env.VITE_REDIRECT_URL,
    signOutRedirectURL: window.configs?.VITE_REDIRECT_URL || import.meta.env.VITE_REDIRECT_URL,
    scope: ["openid", "profile", "email"],
    orgID: window.configs?.VITE_ASGARDEO_ORG_ID || import.meta.env.VITE_ASGARDEO_ORG_ID
};
