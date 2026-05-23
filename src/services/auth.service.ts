import { OAuth2Client } from 'google-auth-library'
import pool from '../database/mysql'

import {
    generateAccessToken,
    generateRefreshToken
} from '../utils/jwt'

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
)

class AuthService {

    async loginWithGoogle(
        credential: string
    ) {

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()

        if (!payload) {
            throw new Error('Invalid Google token')
        }

        const googleId = payload.sub
        const email = payload.email
        const name = payload.name
        const avatar = payload.picture

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        ) as any

        let user

        if (users.length > 0) {

            user = users[0]

        } else {

            const [result] = await pool.query(
                `
                INSERT INTO users (
                    google_id,
                    name,
                    email,
                    avatar
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    googleId,
                    name,
                    email,
                    avatar
                ]
            ) as any

            user = {
                id: result.insertId,
                google_id: googleId,
                name,
                email,
                avatar
            }
        }

        const accessToken = generateAccessToken({
            id: user.id,
            email: user.email
        })

        const refreshToken = generateRefreshToken({
            id: user.id
        })

        await pool.query(
            `
            INSERT INTO refresh_tokens (
                user_id,
                token,
                expires_at
            )
            VALUES (
                ?,
                ?,
                DATE_ADD(NOW(), INTERVAL 7 DAY)
            )
            `,
            [user.id, refreshToken]
        )

        return {
            accessToken,
            refreshToken,
            user
        }
    }
}

export default new AuthService()