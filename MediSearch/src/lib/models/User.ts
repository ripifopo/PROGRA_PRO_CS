// Archivo: src/lib/models/User.ts

// Definición de la interfaz User que representa la estructura de un usuario registrado en el sistema
export interface User {
  // Correo electrónico único del usuario
  email: string;

  // Contraseña cifrada del usuario
  password: string;

  // Nombre del usuario
  name: string;

  // Apellido del usuario
  lastname: string;

  // Fecha de nacimiento del usuario (en formato de cadena)
  birthday: string;

  // Región donde reside el usuario
  region: string;

  // Fecha de creación del registro del usuario (opcional)
  createdAt?: Date;
}
