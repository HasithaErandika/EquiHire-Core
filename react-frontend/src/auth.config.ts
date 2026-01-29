
interface AuthConfig {
    signInRedirectURL: string;
    signOutRedirectURL: string;
    clientID: string;
    baseUrl: string;
    scope: string[];
    orgID: string;
}

export const authConfig: AuthConfig = {
    clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID,
    baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL,
    signInRedirectURL: import.meta.env.VITE_REDIRECT_URL,
    signOutRedirectURL: import.meta.env.VITE_REDIRECT_URL,
    scope: ["openid", "profile", "email"],
    orgID: import.meta.env.VITE_ASGARDEO_ORG_ID
};
