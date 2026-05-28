import bcrypt from 'bcrypt'
import pool from '../database/mysql'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt'
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage'
)

class AuthService {

    async loginWithGoogle(code: string) {

        // Troca o authorization code por tokens do Google
        const { tokens } = await googleClient.getToken(code)
        googleClient.setCredentials(tokens)

        // Verifica e decodifica o ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        })

        const payload = ticket.getPayload()

        if (!payload || !payload.email) {
            throw new Error('Invalid Google token')
        }

        const googleId = payload.sub!
        const email = payload.email
        const name = payload.name ?? ''
        const avatar = payload.picture ?? ''

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        ) as any

        let user

        if (users.length > 0) {
            user = users[0]
        } else {
            const [result] = await pool.query(
                `INSERT INTO users (google_id, name, email, avatar)
                 VALUES (?, ?, ?, ?)`,
                [googleId, name, email, avatar]
            ) as any

            user = {
                id: result.insertId,
                google_id: googleId,
                name,
                email,
                avatar
            }
        }

        const accessToken = generateAccessToken({ id: user.id, email: user.email })
        const refreshToken = generateRefreshToken({ id: user.id })

        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [user.id, refreshToken]
        )

        return { accessToken, refreshToken, user }
    }

    async register(name: string, email: string, password: string) {

        const [existing] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        ) as any

        if (existing.length > 0) {
            throw new Error('Email already in use')
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const [result] = await pool.query(
            `INSERT INTO users (name, email, password)
             VALUES (?, ?, ?)`,
            [name, email, hashedPassword]
        ) as any

        const user = {
            id: result.insertId,
            name,
            email
        }

        return { user }
    }

    async login(email: string, password: string) {

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        ) as any

        if (users.length === 0) {
            throw new Error('Invalid credentials')
        }

        const user = users[0]

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            throw new Error('Invalid credentials')
        }

        const accessToken = generateAccessToken({ id: user.id, email: user.email })
        const refreshToken = generateRefreshToken({ id: user.id })

        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [user.id, refreshToken]
        )

        return { accessToken, refreshToken, user }
    }
}

export default new AuthService()