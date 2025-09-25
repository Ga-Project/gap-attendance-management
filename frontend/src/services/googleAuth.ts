import { gapi } from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const SCOPES = 'openid email profile';

interface GoogleUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

class GoogleAuthService {
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            await new Promise<void>((resolve, reject) => {
                gapi.load('auth2', {
                    callback: resolve,
                    onerror: reject,
                });
            });

            await gapi.auth2.init({
                client_id: CLIENT_ID,
                scope: SCOPES,
            });

            this.isInitialized = true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to initialize Google Auth:', error);
            throw new Error('Google認証の初期化に失敗しました');
        }
    }

    async signIn(): Promise<GoogleUser> {
        await this.initialize();

        try {
            const authInstance = gapi.auth2.getAuthInstance();
            const googleUser = await authInstance.signIn();
            const profile = googleUser.getBasicProfile();

            return {
                id: profile.getId(),
                email: profile.getEmail(),
                name: profile.getName(),
                picture: profile.getImageUrl(),
            };
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Google sign-in failed:', error);
            throw new Error('Googleサインインに失敗しました');
        }
    }

    async signOut(): Promise<void> {
        await this.initialize();

        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Google sign-out failed:', error);
            throw new Error('サインアウトに失敗しました');
        }
    }

    async getCurrentUser(): Promise<GoogleUser | null> {
        await this.initialize();

        try {
            const authInstance = gapi.auth2.getAuthInstance();
            const isSignedIn = authInstance.isSignedIn.get();

            if (!isSignedIn) {
                return null;
            }

            const googleUser = authInstance.currentUser.get();
            const profile = googleUser.getBasicProfile();

            return {
                id: profile.getId(),
                email: profile.getEmail(),
                name: profile.getName(),
                picture: profile.getImageUrl(),
            };
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to get current user:', error);
            return null;
        }
    }
}

const googleAuthService = new GoogleAuthService();
export default googleAuthService;