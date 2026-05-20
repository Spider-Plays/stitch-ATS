import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
}
