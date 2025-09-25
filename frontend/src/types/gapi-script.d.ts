declare module 'gapi-script' {
    interface GoogleAuth {
        isSignedIn: {
            get(): boolean;
        };
        signIn(): Promise<GoogleUser>;
        signOut(): Promise<void>;
        currentUser: {
            get(): GoogleUser;
        };
    }

    interface GoogleUser {
        getBasicProfile(): GoogleProfile;
    }

    interface GoogleProfile {
        getId(): string;
        getEmail(): string;
        getName(): string;
        getImageUrl(): string;
    }

    interface GoogleAuthConfig {
        client_id: string;
        scope: string;
    }

    interface LoadConfig {
        callback?: () => void;
        onerror?: (error: any) => void;
    }

    export const gapi: {
        load(api: string, config: LoadConfig): void;
        auth2: {
            init(config: GoogleAuthConfig): Promise<void>;
            getAuthInstance(): GoogleAuth;
        };
    };
}