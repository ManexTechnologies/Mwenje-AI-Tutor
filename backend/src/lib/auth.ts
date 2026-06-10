// Legacy auth helper kept for compatibility.
// Authentication and user management are handled by backend auth routes and MySQL.

export async function createUser() {
  throw new Error('createUser is deprecated. Use POST /auth/signup.')
}

export async function loginUser() {
  throw new Error('loginUser is deprecated. Use POST /auth/login.')
}
