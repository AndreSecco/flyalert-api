import { Request, Response } from 'express'
import authService from '../services/auth.service'

const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000
}

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { code } = req.body  // ✅ era { accessToken: googleToken }

        if (!code) {
            return res.status(400).json({ message: 'Authorization code is required' })
        }

        const data = await authService.loginWithGoogle(code)

        res.cookie('refreshToken', data.refreshToken, cookieOptions)

        return res.json({
            accessToken: data.accessToken,
            user: data.user
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Authentication error' })
    }
}

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        const data = await authService.register(name, email, password)

        return res.status(201).json({ user: data.user })

    } catch (error: any) {
        if (error.message === 'Email already in use') {
            return res.status(409).json({ message: error.message })
        }
        console.error(error)
        return res.status(500).json({ message: 'Registration error' })
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body
       
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        const data = await authService.login(email, password)

        res.cookie('refreshToken', data.refreshToken, cookieOptions)

        return res.json({
            accessToken: data.accessToken,
            user: data.user
        })

    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ message: error.message })
        }
        console.error(error)
        return res.status(500).json({ message: 'Login error' })
    }
}

export const profile = async (req: any, res: Response) => {
    return res.json({ user: req.user })
}