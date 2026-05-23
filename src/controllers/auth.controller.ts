import { Request, Response } from 'express'

import authService from '../services/auth.service'

export const googleLogin = async (
    req: Request,
    res: Response
) => {

    try {

        const { credential } = req.body

        console.log(credential.credential)

        const data = await authService.loginWithGoogle(
            credential.credential
        )

        res.cookie(
            'refreshToken',
            data.refreshToken,
            {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            }
        )

        return res.json({
            accessToken: data.accessToken,
            user: data.user
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: 'Authentication error'
        })
    }
}

export const profile = async (
    req: any,
    res: Response
) => {

    return res.json({
        user: req.user
    })
}