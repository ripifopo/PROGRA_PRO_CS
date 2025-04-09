// Archivo: lib/models/User.ts

export interface User {
    _id?: string;
    email: string;
    password: string;
    name?: string;
    lastname?: string;
    birthday?: string;
    region?: string;
    weight?: string;
    frequentMeds?: string[];
    treatments?: {
      name: string;
      dosage: string;
      duration: string;
    }[];
  }
  