export const POSITION = ['junior' , 'senior'] as const;
export const EMPLOYMENT_TYPE = ['full' , 'part' , 'intern' , 'contract' , 'freelance'] as const;
export const WORKTYPE = ['remote' , 'on-site' , 'hybrid'] as const;
export const EDUCATION_LEVEL = ['Bachelor','Master','PhD','+2/A-levels','SEE','others'] as const;
export const ROLE = ['job_seeker','company'] as const;
export const APPLICATION_STATUS = ['pending','rejected','accepted','shortlisted','interviewed','withdrawn','cancelled'] as const;
export const UPDATE_APPLICATION_STATUS = ['rejected','accepted','shortlisted','interviewed'] as const;
export const COOKIES_OPTIONS = {
    httpOnly: true,
    maxAge: 7*24*60*60*1000,
    sameSite: "strict" as const
} as const