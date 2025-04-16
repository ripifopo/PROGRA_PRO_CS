// Archivo: src/lib/models/User.ts

export interface User {
  email: string;
  password: string;
  name: string;
  lastname: string;
  birthday: string;
  region: string;
  createdAt?: Date;
}
