import { Request, Response } from 'express'
import pool from '../database/mysql'

export const testSelect = async (
    req: Request,
    res: Response
) => { 
    const data: Object = {
        query: req.query,
        body: req.body, 
    }

    const [users] = await pool.query(
        `
        SELECT * FROM users
        `
    ) as any

    let user = users
    res.json(user)
}