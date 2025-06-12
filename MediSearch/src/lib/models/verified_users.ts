// src/models/verified_users.ts

export interface VerifiedUser {
    email: string;
    verified: boolean;
    verificationToken: string;
    createdAt: Date;
    verifiedAt?: Date;
  }
  