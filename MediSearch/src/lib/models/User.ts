// Modelo de usuario que define los campos a guardar en MongoDB

export interface User {
  email: string;              // Correo del usuario (único)
  password: string;           // Contraseña cifrada
  name: string;               // Nombre del usuario
  lastname: string;           // Apellido
  birthday: string;           // Fecha de nacimiento
  region: string;             // Región
  weight: string;             // Peso
  createdAt?: Date;           // Fecha de creación
}
